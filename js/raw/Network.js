// --- Internal ------------------------------------------------------------------

function prefixLengthToNetMaskUint32(prefixLength) {
	return prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0
}

// -------------------------------------------------------------------------------
// Pure value types
// -------------------------------------------------------------------------------

// --- IpAddress ----------------------------------------------------------------

export class IpAddress {
	constructor(octet1, octet2, octet3, octet4) {
		this.octet1 = octet1
		this.octet2 = octet2
		this.octet3 = octet3
		this.octet4 = octet4
	}

	static fromDotNotationString(str) {
		const octets = str.split('.').map(Number)
		if (octets.length !== 4 || octets.some(n => isNaN(n) || n < 0 || n > 255))
			raise(`Invalid IPv4 address string: "${str}"`)
		return new IpAddress(...octets)
	}

	static fromOctets(octet1, octet2, octet3, octet4) {
		return new IpAddress(octet1, octet2, octet3, octet4)
	}

	static fromUint32(uint32) {
		return new IpAddress(
			(uint32 >>> 24) & 0xff,
			(uint32 >>> 16) & 0xff,
			(uint32 >>> 8) & 0xff,
			(uint32 ) & 0xff
		)
	}

	toUint32() {
		return (
			((this.octet1 & 0xff) << 24) |
			((this.octet2 & 0xff) << 16) |
			((this.octet3 & 0xff) << 8) |
			 (this.octet4 & 0xff)
		) >>> 0
	}

	toDotNotationString() {
		return `${this.octet1}.${this.octet2}.${this.octet3}.${this.octet4}`
	}

	toOctetsArray() {
		return [this.octet1, this.octet2, this.octet3, this.octet4]
	}

	equals(other) { return other instanceof IpAddress && this.toUint32() === other.toUint32() }
	isLessThan(other) { return this.toUint32() < other.toUint32() }
	isGreaterThan(other){ return this.toUint32() > other.toUint32() }

	// RFC 1122 §3.2.1.3 - "this" network source
	isUnspecified() { return this.octet1 === 0 }

	// RFC 5735 - entire 127.0.0.0/8 block
	isLoopback() { return this.octet1 === 127 }

	// RFC 1918 - 10/8, 172.16/12, 192.168/16
	isRfc1918Private() {
		return this.octet1 === 10
			|| (this.octet1 === 172 && this.octet2 >= 16 && this.octet2 <= 31)
			|| (this.octet1 === 192 && this.octet2 === 168)
	}

	// RFC 3927 - 169.254.0.0/16
	isLinkLocal() { return this.octet1 === 169 && this.octet2 === 254 }

	// RFC 3171 - 224.0.0.0/4
	isMulticast() { return this.octet1 >= 224 && this.octet1 <= 239 }

	// RFC 1112 §4 - 240.0.0.0/4
	isReservedFutureUse(){ return this.octet1 >= 240 && this.octet1 <= 254 }

	// RFC 919 §7 - 255.255.255.255/32
	isLimitedBroadcast() {
		return this.octet1 === 255 && this.octet2 === 255
			&& this.octet3 === 255 && this.octet4 === 255
	}

	isPubliclyRoutable() {
		return !this.isUnspecified()
			&& !this.isLoopback()
			&& !this.isRfc1918Private()
			&& !this.isLinkLocal()
			&& !this.isMulticast()
			&& !this.isReservedFutureUse()
			&& !this.isLimitedBroadcast()
	}

	toString() { return this.toDotNotationString() }
}

export class IpAddressRange {
	constructor(startAddress, endAddress) {
		expectInstanceOf(startAddress, IpAddress)
		expectInstanceOf(endAddress, IpAddress)
		this.startAddress = startAddress
		this.endAddress = endAddress
	}

	static fromStartAndEndAddresses(startAddress, endAddress) {
		if (startAddress.isGreaterThan(endAddress))
			raise(`Range start ${startAddress} is after end ${endAddress}`)
		return new IpAddressRange(startAddress, endAddress)
	}

	containsAddress(address) {
		expectInstanceOf(address, IpAddress)
		const uint32 = address.toUint32()
		return uint32 >= this.startAddress.toUint32()
			&& uint32 <= this.endAddress.toUint32()
	}

	containsRange(other) {
		expectInstanceOf(other, IpAddressRange)
		return this.startAddress.toUint32() <= other.startAddress.toUint32()
			&& this.endAddress.toUint32() >= other.endAddress.toUint32()
	}

	overlapsWithRange(other) {
		expectInstanceOf(other, IpAddressRange)
		return this.startAddress.toUint32() <= other.endAddress.toUint32()
			&& this.endAddress.toUint32() >= other.startAddress.toUint32()
	}

	countAddresses() {
		return (this.endAddress.toUint32() - this.startAddress.toUint32() + 1) >>> 0
	}

	equals(other) {
		return other instanceof IpAddressRange
			&& this.startAddress.equals(other.startAddress)
			&& this.endAddress.equals(other.endAddress)
	}

	toString() {
		return `${this.startAddress.toDotNotationString()} - ${this.endAddress.toDotNotationString()}`
	}
}

export class CidrBlock {
	constructor(networkAddress, prefixLength) {
		expectInstanceOf(networkAddress, IpAddress)
		this.networkAddress = networkAddress
		this.prefixLength = prefixLength
	}

	static fromString(str) {
		const [addrStr, prefixStr] = str.split('/')
		const prefixLength = Number(prefixStr)
		if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32)
			raise(`Invalid CIDR notation string: "${str}"`)
		return new CidrBlock(IpAddress.fromDotNotationString(addrStr), prefixLength)
	}

	static fromAddressAndPrefixLength(networkAddress, prefixLength) {
		expectInstanceOf(networkAddress, IpAddress)
		if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32)
			raise(`Invalid prefix length: ${prefixLength}`)
		return new CidrBlock(networkAddress, prefixLength)
	}

	getMaskedNetworkAddress() {
		const mask = prefixLengthToNetMaskUint32(this.prefixLength)
		return IpAddress.fromUint32((this.networkAddress.toUint32() & mask) >>> 0)
	}

	getBroadcastAddress() {
		const mask = prefixLengthToNetMaskUint32(this.prefixLength)
		const networkU32 = (this.networkAddress.toUint32() & mask) >>> 0
		return IpAddress.fromUint32((networkU32 | (~mask >>> 0)) >>> 0)
	}

	getNetMaskAddress() {
		return IpAddress.fromUint32(prefixLengthToNetMaskUint32(this.prefixLength))
	}

	toIpAddressRange() {
		return IpAddressRange.fromStartAndEndAddresses(
			this.getMaskedNetworkAddress(),
			this.getBroadcastAddress()
		)
	}

	equals(other) {
		return other instanceof CidrBlock
			&& this.getMaskedNetworkAddress().equals(other.getMaskedNetworkAddress())
			&& this.prefixLength === other.prefixLength
	}

	toString() {
		return `${this.getMaskedNetworkAddress().toDotNotationString()}/${this.prefixLength}`
	}
}

export class Port {
	constructor(portNumber) {
		this.portNumber = portNumber
	}

	static fromNumber(portNumber) {
		if (!Number.isInteger(portNumber) || portNumber < 0 || portNumber > 65535)
			raise(`Invalid port number: ${portNumber}`)
		return new Port(portNumber)
	}

	isWellKnown() { return this.portNumber < 1024 }
	isRegistered() { return this.portNumber >= 1024 && this.portNumber <= 49151 }
	isEphemeral() { return this.portNumber >= 49152 }

	equals(other) { return other instanceof Port && this.portNumber === other.portNumber }
	toNumber() { return this.portNumber }
	toString() { return String(this.portNumber) }
}

export class MacAddress {
	constructor(octets) {
		this.octets = octets // Uint8Array(6)
	}

	static fromColonHexString(str) {
		const parts = str.split(':')
		if (parts.length !== 6 || parts.some(p => !/^[0-9a-fA-F]{1,2}$/.test(p)))
			raise(`Invalid MAC address string: "${str}"`)
		return new MacAddress(new Uint8Array(parts.map(p => parseInt(p, 16))))
	}

	static fromHyphenHexString(str) {
		return MacAddress.fromColonHexString(str.replace(/-/g, ':'))
	}

	static fromUint8Array(uint8Array) {
		if (uint8Array.length !== 6)
			raise(`MAC address requires exactly 6 bytes, got ${uint8Array.length}`)
		return new MacAddress(new Uint8Array(uint8Array))
	}

	isMulticast() { return (this.octets[0] & 0x01) !== 0 }
	isBroadcast() { return this.octets.every(b => b === 0xff) }
	isLocallyAdministered(){ return (this.octets[0] & 0x02) !== 0 }
	isGloballyUnique() { return !this.isLocallyAdministered() }

	equals(other) {
		return other instanceof MacAddress
			&& this.octets.every((b, i) => b === other.octets[i])
	}

	toColonHexString() {
		return Array.from(this.octets).map(b => b.toString(16).padStart(2, '0')).join(':')
	}

	toHyphenHexString() { return this.toColonHexString().replace(/:/g, '-') }
	toString() { return this.toColonHexString() }
}

export class SocketAddress {
	constructor(ipAddress, port) {
		expectInstanceOf(ipAddress, IpAddress)
		expectInstanceOf(port, Port)
		this.ipAddress = ipAddress
		this.port = port
	}

	static fromIpAddressAndPort(ipAddress, port) {
		return new SocketAddress(ipAddress, port)
	}

	static fromString(str) {
		const lastColon = str.lastIndexOf(':')
		if (lastColon === -1) raise(`Invalid socket address string: "${str}"`)
		return new SocketAddress(
			IpAddress.fromDotNotationString(str.slice(0, lastColon)),
			Port.fromNumber(Number(str.slice(lastColon + 1)))
		)
	}

	equals(other) {
		return other instanceof SocketAddress
			&& this.ipAddress.equals(other.ipAddress)
			&& this.port.equals(other.port)
	}

	toString() { return `${this.ipAddress.toDotNotationString()}:${this.port.toNumber()}` }
}

// -------------------------------------------------------------------------------
// Interface and network primitives
// -------------------------------------------------------------------------------

// Physical or virtual adapter on a host (eth0, wlan0, docker0, etc.)
export class NetworkInterface {
	constructor(name, ipAddress, cidrBlock, macAddress = null, mtu = 1500) {
		expectInstanceOf(ipAddress, IpAddress)
		expectInstanceOf(cidrBlock, CidrBlock)
		if (macAddress !== null) expectInstanceOf(macAddress, MacAddress)
		this.name = name
		this.ipAddress = ipAddress
		this.cidrBlock = cidrBlock
		this.macAddress = macAddress
		this.mtu = mtu
		this._subnetRange = cidrBlock.toIpAddressRange()
	}

	static fromNameIpAndCidr(name, ipAddress, cidrBlock, macAddress = null, mtu = 1500) {
		return new NetworkInterface(name, ipAddress, cidrBlock, macAddress, mtu)
	}

	isAddressOnThisSubnet(address) {
		return this._subnetRange.containsAddress(address)
	}

	canReachAddressWithoutRouting(address) {
		return this.isAddressOnThisSubnet(address)
	}

	withMtu(mtu) {
		return new NetworkInterface(this.name, this.ipAddress, this.cidrBlock, this.macAddress, mtu)
	}

	toString() { return `${this.name} ${this.ipAddress} (${this.cidrBlock})` }
}

// Application-level endpoint: a service reachable at a socket address over a
// protocol. Carries optional DNS names that resolve to it.
export class NetEndpoint {
	constructor(socketAddress, protocol = null, macAddress = null) {
		expectInstanceOf(socketAddress, SocketAddress)
		if (macAddress !== null) expectInstanceOf(macAddress, MacAddress)
		this.socketAddress = socketAddress
		this.protocol = protocol
		this.macAddress = macAddress
		this._dnsNames = new Set()
	}

	static fromSocketAddress(socketAddress, protocol = null, macAddress = null) {
		return new NetEndpoint(socketAddress, protocol, macAddress)
	}

	addDnsNames(...names) {
		for (const name of names) this._dnsNames.add(name)
		return this
	}

	getDnsNames() { return [...this._dnsNames] }
	resolvesDnsName(name) { return this._dnsNames.has(name) }

	toUrlString() {
		return this.protocol
			? `${this.protocol}://${this.socketAddress}`
			: this.socketAddress.toString()
	}

	toString() { return this.toUrlString() }
}

// Value type representing an IP address block. Pure math, no identity.
export class IpNetwork {
	constructor(cidrBlock) {
		expectInstanceOf(cidrBlock, CidrBlock)
		this.cidrBlock = cidrBlock
		this._range = cidrBlock.toIpAddressRange()
	}

	static fromCidrBlock(cidrBlock) {
		return new IpNetwork(cidrBlock)
	}

	getNetworkAddress() { return this._range.startAddress }
	getBroadcastAddress() { return this._range.endAddress }
	getPrefixLength() { return this.cidrBlock.prefixLength }

	getFirstUsableHostAddress() {
		return IpAddress.fromUint32(this._range.startAddress.toUint32() + 1)
	}

	getLastUsableHostAddress() {
		return IpAddress.fromUint32(this._range.endAddress.toUint32() - 1)
	}

	countUsableHostAddresses() {
		const total = this._range.countAddresses()
		return total > 2 ? total - 2 : 0
	}

	containsAddress(address) {
		return this._range.containsAddress(address)
	}

	containsNetwork(other) {
		expectInstanceOf(other, IpNetwork)
		return this._range.containsRange(other._range)
	}

	overlapsWithNetwork(other) {
		expectInstanceOf(other, IpNetwork)
		return this._range.overlapsWithRange(other._range)
	}

	isEntirelyRfc1918Private() {
		return this._range.startAddress.isRfc1918Private()
			&& this._range.endAddress.isRfc1918Private()
	}

	splitIntoTwoEqualHalves() {
		const total = this._range.countAddresses()
		if (total < 4 || (total & (total - 1)) !== 0)
			raise(`Cannot split ${this.cidrBlock} into two equal subnets`)
		const half = total / 2
		const startU32 = this._range.startAddress.toUint32()
		const midU32 = (startU32 + half) >>> 0
		const newPrefix = this.cidrBlock.prefixLength + 1
		return [
			IpNetwork.fromCidrBlock(CidrBlock.fromAddressAndPrefixLength(
				IpAddress.fromUint32(startU32), newPrefix
			)),
			IpNetwork.fromCidrBlock(CidrBlock.fromAddressAndPrefixLength(
				IpAddress.fromUint32(midU32), newPrefix
			)),
		]
	}

	equals(other) {
		return other instanceof IpNetwork && this.cidrBlock.equals(other.cidrBlock)
	}

	toString() { return this.cidrBlock.toString() }
}

// Entity: a named logical network domain. Has identity, owns endpoints, tracks
// DNS, optionally owned by another domain (e.g. a docker bridge owned by a host
// network). Inherits all IP math from IpNetwork.
export class RoutingDomain extends IpNetwork {
	constructor(id, name, cidrBlock, owner = null) {
		super(cidrBlock)
		if (owner !== null) expectInstanceOf(owner, RoutingDomain)
		this.id = id
		this.name = name
		this._owner = owner
		this._endpoints = new Set()
		this._dnsMap = new Map() // string -> NetEndpoint
		this._gateway = null // NetEndpoint
	}

	static fromIdNameAndCidrBlock(id, name, cidrBlock, owner = null) {
		return new RoutingDomain(id, name, cidrBlock, owner)
	}

	getOwner() { return this._owner }
	getGateway() { return this._gateway }

	setGateway(endpoint) {
		expectInstanceOf(endpoint, NetEndpoint)
		this._gateway = endpoint
		return this
	}

	registerEndpoint(endpoint) {
		expectInstanceOf(endpoint, NetEndpoint)
		this._endpoints.add(endpoint)
		for (const name of endpoint.getDnsNames())
			this._dnsMap.set(name, endpoint)
		return this
	}

	unregisterEndpoint(endpoint) {
		expectInstanceOf(endpoint, NetEndpoint)
		this._endpoints.delete(endpoint)
		for (const name of endpoint.getDnsNames())
			if (this._dnsMap.get(name) === endpoint)
				this._dnsMap.delete(name)
		return this
	}

	registerDnsNameForEndpoint(dnsName, endpoint) {
		expectInstanceOf(endpoint, NetEndpoint)
		this._dnsMap.set(dnsName, endpoint)
		return this
	}

	resolveEndpointByDnsName(dnsName) { return this._dnsMap.get(dnsName) ?? null }
	getEndpoints() { return [...this._endpoints] }
	getRegisteredDnsNames() { return [...this._dnsMap.keys()] }

	toString() { return `RoutingDomain(${this.name} ${this.cidrBlock})` }
}

// -------------------------------------------------------------------------------
// known constants
// -------------------------------------------------------------------------------

export const Ip = Object.freeze({
	Loopback: IpAddress.fromDotNotationString('127.0.0.1'),
	Any: IpAddress.fromDotNotationString('0.0.0.0'),
	LimitedBroadcast: IpAddress.fromDotNotationString('255.255.255.255'),
	LinkLocalBase: IpAddress.fromDotNotationString('169.254.0.0'),
})

export const WellKnownPort = Object.freeze({
	Ftp: Port.fromNumber(21),
	Ssh: Port.fromNumber(22),
	Telnet: Port.fromNumber(23),
	Smtp: Port.fromNumber(25),
	Dns: Port.fromNumber(53),
	Http: Port.fromNumber(80),
	Https: Port.fromNumber(443),
})

export const WellKnownNetwork = Object.freeze({
	LoopbackBlock: IpNetwork.fromCidrBlock(CidrBlock.fromString('127.0.0.0/8')),
	Rfc1918_10: IpNetwork.fromCidrBlock(CidrBlock.fromString('10.0.0.0/8')),
	Rfc1918_172: IpNetwork.fromCidrBlock(CidrBlock.fromString('172.16.0.0/12')),
	Rfc1918_192: IpNetwork.fromCidrBlock(CidrBlock.fromString('192.168.0.0/16')),
	LinkLocal: IpNetwork.fromCidrBlock(CidrBlock.fromString('169.254.0.0/16')),
	Multicast: IpNetwork.fromCidrBlock(CidrBlock.fromString('224.0.0.0/4')),
})