
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

	equals(other) {
		return expectinstanceof(other, IpAddress)
            && this.toUint32() === other.toUint32()
	}

	isLessThan(other) { return this.toUint32() < other.toUint32() }

	isGreaterThan(other) { return this.toUint32() > other.toUint32() }

	// RFC 5735 / RFC 1918 classification
	// Sources: RFC 1918, RFC 5735, RFC 3927

	// 0.0.0.0/8 — "this" network source address (RFC 1122 §3.2.1.3)
	isUnspecified() { return this.octet1 === 0 }

	// 127.0.0.0/8 — entire block reserved for loopback (RFC 5735)
	isLoopback() { return this.octet1 === 127 }

	// RFC 1918 private-use ranges: 10/8, 172.16/12, 192.168/16
	isPrivateRfc1918() {
		return this.octet1 === 10
			|| (this.octet1 === 172 && this.octet2 >= 16 && this.octet2 <= 31)
			|| (this.octet1 === 192 && this.octet2 === 168)
	}

	// 169.254.0.0/16 — link-local autoconfiguration (RFC 3927)
	isLinkLocal() {
		return this.octet1 === 169 && this.octet2 === 254
	}

	// 224.0.0.0/4 — multicast (RFC 3171)
	isMulticast() { return this.octet1 >= 224 && this.octet1 <= 239 }

	// 240.0.0.0/4 — reserved for future use (RFC 1112 §4)
	isReservedFutureUse() { return this.octet1 >= 240 && this.octet1 <= 254 }

	// 255.255.255.255/32 — limited broadcast (RFC 919 §7)
	isLimitedBroadcast() {
		return this.octet1 === 255 && this.octet2 === 255
			&& this.octet3 === 255 && this.octet4 === 255
	}

	// Any address not routable on the public internet per RFC 5735
	isPubliclyRoutable() {
		return !this.isUnspecified()
			&& !this.isLoopback()
			&& !this.isPrivateRfc1918()
			&& !this.isLinkLocal()
			&& !this.isMulticast()
			&& !this.isReservedFutureUse()
			&& !this.isLimitedBroadcast()
	}
}

export class IpAddressRange {
	constructor(startAddress, endAddress) {
		this.startAddress = startAddress
		this.endAddress = endAddress
	}

	static fromCidrNotationString(cidr) {
		const [addrStr, prefixLenStr] = cidr.split('/')
		const prefixLength = Number(prefixLenStr)
		if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32)
			raise(`Invalid CIDR notation string: "${cidr}"`)
		const baseAddress = IpAddress.fromDotNotationString(addrStr)
		const mask = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0
		const networkUint32 = (baseAddress.toUint32() & mask) >>> 0
		const broadcastUint32 = (networkUint32 | (~mask >>> 0)) >>> 0
		return new IpAddressRange(
			IpAddress.fromUint32(networkUint32),
			IpAddress.fromUint32(broadcastUint32)
		)
	}

	static fromStartAndEndAddresses(startAddress, endAddress) {
		if (startAddress.isGreaterThan(endAddress))
			raise(`Range start address ${startAddress.toDotNotationString()} is after end address ${endAddress.toDotNotationString()}`)
		return new IpAddressRange(startAddress, endAddress)
	}

	containsAddress(address) {
		const uint32 = address.toUint32()
		return uint32 >= this.startAddress.toUint32()
			&& uint32 <= this.endAddress.toUint32()
	}

	overlapsWithRange(other) {
		return this.startAddress.toUint32() <= other.endAddress.toUint32()
			&& this.endAddress.toUint32() >= other.startAddress.toUint32()
	}

	countAddresses() {
		return (this.endAddress.toUint32() - this.startAddress.toUint32() + 1) >>> 0
	}

	equals(other) {
		return expectinstanceof(other, IpAddressRange)
			&& this.startAddress.equals(other.startAddress)
			&& this.endAddress.equals(other.endAddress)
	}

	toCidrNotationStringIfPossible() {
		const start = this.startAddress.toUint32()
		const end = this.endAddress.toUint32()
		const size = (end - start + 1) >>> 0
		if ((size & (size - 1)) !== 0) return null // not power of two
		if ((start & (size - 1)) !== 0) return null // not aligned
		const prefixLength = 32 - Math.log2(size)
		return `${this.startAddress.toDotNotationString()}/${prefixLength}`
	}

	toString() {
		return `${this.startAddress.toDotNotationString()} - ${this.endAddress.toDotNotationString()}`
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

	// 0–1023 per IANA
	isWellKnown() { return this.portNumber < 1024 }

	// 1024–49151 per IANA
	isRegistered() { return this.portNumber >= 1024 && this.portNumber <= 49151 }

	// 49152–65535 per RFC 6335
	isEphemeral() { return this.portNumber >= 49152 }

	equals(other) {
		return expectinstanceof(other, Port)
            && this.portNumber === other.portNumber
	}

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

	// Bit 0 of first octet set = multicast (also covers broadcast)
	isMulticast() { return (this.octets[0] & 0x01) !== 0 }

	// All octets 0xff
	isBroadcast() { return this.octets.every(b => b === 0xff) }

	// Bit 1 of first octet set = locally administered
	isLocallyAdministered() { return (this.octets[0] & 0x02) !== 0 }

	// Globally unique = not locally administered
	isGloballyUnique() { return !this.isLocallyAdministered() }

	equals(other) {
		return expectinstanceof(other, MacAddress)
			&& this.octets.every((b, i) => b === other.octets[i])
	}

	toColonHexString() {
		return Array.from(this.octets)
			.map(b => b.toString(16).padStart(2, '0'))
			.join(':')
	}

	toHyphenHexString() {
		return this.toColonHexString().replace(/:/g, '-')
	}

	toString() { return this.toColonHexString() }
}

export class SocketAddress {
	constructor(ipAddress, port) {
		this.ipAddress = ipAddress
		this.port = port
	}

	static fromIpAddressAndPort(ipAddress, port) {
		return new SocketAddress(ipAddress, port)
	}

	static fromHostPortString(str) {
		const lastColon = str.lastIndexOf(':')
		if (lastColon === -1) raise(`Invalid host:port string: "${str}"`)
		const ipAddress = IpAddress.fromDotNotationString(str.slice(0, lastColon))
		const port = Port.fromNumber(Number(str.slice(lastColon + 1)))
		return new SocketAddress(ipAddress, port)
	}

	equals(other) {
		return expectinstanceof(other, SocketAddress)
			&& this.ipAddress.equals(other.ipAddress)
			&& this.port.equals(other.port)
	}

	toString() {
		return `${this.ipAddress.toDotNotationString()}:${this.port.toNumber()}`
	}
}

export class NetworkInterface {
	constructor(name, ipAddress, subnetCidr, macAddress = null, mtu = 1500) {
		this.name = name
		this.ipAddress = ipAddress
		this.subnetRange = IpAddressRange.fromCidrNotationString(subnetCidr)
		this.macAddress = macAddress
		this.mtu = mtu
	}

	static fromConfig({ name, ipAddress, subnetCidr, macAddress = null, mtu = 1500 }) {
		const parsedIp = IpAddress.fromDotNotationString(ipAddress)
		const parsedMac = macAddress ? MacAddress.fromColonHexString(macAddress) : null
		return new NetworkInterface(name, parsedIp, subnetCidr, parsedMac, mtu)
	}

	isAddressOnThisSubnet(address) {
		return this.subnetRange.containsAddress(address)
	}

	canReachAddressWithoutRouting(address) {
		return this.isAddressOnThisSubnet(address)
	}

	withMtu(mtu) {
		return new NetworkInterface(
			this.name, this.ipAddress,
			this.subnetRange.toCidrNotationStringIfPossible(),
			this.macAddress, mtu
		)
	}

	toString() {
		return `${this.name} ${this.ipAddress.toDotNotationString()} (${this.subnetRange.toCidrNotationStringIfPossible() ?? this.subnetRange.toString()})`
	}
}

export class Network {
	constructor(cidr) {
		this.range = IpAddressRange.fromCidrNotationString(cidr)
		this.cidr = cidr
	}

	static fromCidr(cidr) { return new Network(cidr) }

	containsAddress(address) {
		return this.range.containsAddress(address)
	}

	containsSubnetwork(other) {
		return this.range.startAddress.toUint32() <= other.range.startAddress.toUint32()
			&& this.range.endAddress.toUint32() >= other.range.endAddress.toUint32()
	}

	overlapsWithNetwork(other) {
		return this.range.overlapsWithRange(other.range)
	}

	getNetworkAddress() { return this.range.startAddress }
	getBroadcastAddress() { return this.range.endAddress }

	getFirstUsableHostAddress() {
		return IpAddress.fromUint32(this.range.startAddress.toUint32() + 1)
	}

	getLastUsableHostAddress() {
		return IpAddress.fromUint32(this.range.endAddress.toUint32() - 1)
	}

	countUsableHostAddresses() {
		const total = this.range.countAddresses()
		return total > 2 ? total - 2 : 0
	}

	isPrivateRfc1918Network() {
		return this.range.startAddress.isPrivateRfc1918()
			&& this.range.endAddress.isPrivateRfc1918()
	}

	splitIntoTwoEqualHalves() {
		const total = this.range.countAddresses()
		if (total < 2 || (total & (total - 1)) !== 0)
			raise(`Cannot split network of ${total} addresses into two equal halves`)
		const half = total / 2
		const startU32 = this.range.startAddress.toUint32()
		const midU32 = (startU32 + half) >>> 0
		return [
			new Network(IpAddressRange.fromStartAndEndAddresses(
				IpAddress.fromUint32(startU32),
				IpAddress.fromUint32(midU32 - 1)
			).toCidrNotationStringIfPossible()),
			new Network(IpAddressRange.fromStartAndEndAddresses(
				IpAddress.fromUint32(midU32),
				IpAddress.fromUint32(this.range.endAddress.toUint32())
			).toCidrNotationStringIfPossible()),
		]
	}

	toString() { return this.cidr }
}

export const Ip = Object.freeze({
	Loopback: IpAddress.fromDotNotationString('127.0.0.1'),
	Any: IpAddress.fromDotNotationString('0.0.0.0'),
	LimitedBroadcast: IpAddress.fromDotNotationString('255.255.255.255'),
	LinkLocalBase: IpAddress.fromDotNotationString('169.254.0.0'),
})

export const WellKnownPort = Object.freeze({
	Http: Port.fromNumber(80),
	Https: Port.fromNumber(443),
	Dns: Port.fromNumber(53),
	Ssh: Port.fromNumber(22),
	Ftp: Port.fromNumber(21),
	Smtp: Port.fromNumber(25),
	Telnet: Port.fromNumber(23),
})

export const WellKnownNetwork = Object.freeze({
	LoopbackBlock: Network.fromCidr('127.0.0.0/8'),
	Rfc1918ClassA: Network.fromCidr('10.0.0.0/8'),
	Rfc1918ClassB: Network.fromCidr('172.16.0.0/12'),
	Rfc1918ClassC: Network.fromCidr('192.168.0.0/16'),
	LinkLocal: Network.fromCidr('169.254.0.0/16'),
	Multicast: Network.fromCidr('224.0.0.0/4'),
})