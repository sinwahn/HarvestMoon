// HarvestMoon - auto-generated bundle (all)
// DO NOT EDIT - edit source files in raw/ and re-run build.ps1

const HM = (() => {
	'use strict'
	// ------------------------------------------------------------------------
	// common.js
	// ------------------------------------------------------------------------
	function raise(message) {
		throw new Error(message)
	}

	function raise_typeerror(message) {
		throw new TypeError(message)
	}

	function assert(value, optMessage) {
		if (value === undefined || value === null || value === false)
			raise(optMessage || 'assertation failed!')
		return value
	}

	function istype(value, t0 = '', t1 = '', t2 = '', t3 = '', t4 = '', t5 = '', t6 = '', t7 = '') {
		const t = typeof value
		return t === t0 || t === t2 || t === t3 || t === t4 || t === t5 || t === t6 || t === t7
	}

	function expecttype(value, t0 = '', t1 = '', t2 = '', t3 = '', t4 = '', t5 = '', t6 = '', t7 = '') {
		const t = typeof value
		if (t === t0 || t === t2 || t === t3 || t === t4 || t === t5 || t === t6 || t === t7)
			return value
		// we are in the error anyway, who cares
		const typeNames = [t0, t1, t2, t3, t4, t5, t6, t7].filter(Boolean)
		raise_typeerror(`'${typeNames.join(" | ")}' expected, got '${t}'`)
	}

	function expectinstanceof(
		value,
		c0 = undefined, c1 = undefined, c2 = undefined, c3 = undefined,
		c4 = undefined, c5 = undefined, c6 = undefined, c7 = undefined
	) {
		if (c0 !== undefined) {
			if (typeof c0 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c0)
				return value
		}

		if (c1 !== undefined) {
			if (typeof c1 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c1)
				return value
		}

		if (c2 !== undefined) {
			if (typeof c2 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c2)
				return value
		}

		if (c3 !== undefined) {
			if (typeof c3 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c3)
				return value
		}

		if (c4 !== undefined) {
			if (typeof c4 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c4)
				return value
		}

		if (c5 !== undefined) {
			if (typeof c5 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c5)
				return value
		}

		if (c6 !== undefined) {
			if (typeof c6 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c6)
				return value
		}

		if (c7) {
			if (typeof c7 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c7)
				return value
		}

		const classNames = [c0, c1, c2, c3, c4, c5, c6, c7]
			.filter(Boolean)
			.map(c => c.name || "<anonymous>")

		const expected = classNames.join(" | ")
		const actual =
			value === null ? "null" :
			value?.constructor?.name ?? typeof value

		raise_typeerror(`'${expected}' expected, got '${actual}'`)
	}

	if (module !== undefined && module.exports) {
		module.exports = { raise, raise_typeerror, assert, istype, expecttype, expectinstanceof }
	}

	// ------------------------------------------------------------------------
	// containers.js
	// ------------------------------------------------------------------------
	class Container {}

	class _ArrayLike extends Container {
		_data

		constructor(...args) {
			super()
			this._data = new globalThis.Array(...args)
		}

		*[Symbol.iterator]() {
			for (const element of this._data)
				yield element
		}
	
		clear() {
			this._data.length = 0
		}

		getData() {
			return this._data
		}

		getSize() {
			return this._data.length
		}

		isEmpty() {
			return this._data.length === 0
		}
	
		count(value) {
			let result = 0
			for (const item of this._data)
				if (value == item)
					result += 1
			return result
		}

		countBy(predicate) {
			let result = 0
			for (let i = 0; i < this.getSize(); i++)
				if (predicate(this._data[i], i))
					result += 1
			return result
		}

		findPos(value) {
			const index = this._data.indexOf(value)
			return index === -1 ? undefined : index
		}

		findPosBy(predicate) {
			for (let i = 0; i < this.getSize(); i++)
				if (predicate(this._data[i], i))
					return i
			return undefined
		}

		forEach(predicate) {
			for (let i = 0; i < this.getSize(); i++)
				predicate(this._data[i], i)
		}

		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this.getSize())
			for (const value of this._data)
				itemWritePredicate(writer, value)
		}

		readData(reader, sizeReadMethod, itemReadPredicate) {
			const count = sizeReadMethod(reader)
			this.clear()
			for (let i = 0; i < count; i++) {
				const value = itemReadPredicate(reader)
				assert(value !== undefined)
				this._data[i] = value
			}
		}
	}

	class Vector extends _ArrayLike {

		constructor(...args) {
			super(...args);
		}
	
		set(index, value) {
		    expecttype(index, "number")
		    assert(index >= 0, `index must be non-negative: ${index}`)
		    assert(index < this.getSize(), `index out of bounds: ${index}`)
		    this._data[index] = value
		}
	
		get(index) {
		    assert(index >= 0 && index < this.getSize(), `vector index out of bounds: ${index}`)
		    return this._data[index]
		}

		front() {
			assert(!this.isEmpty(), "vector is empty")
			return this._data[0]
		}

		back() {
			assert(!this.isEmpty(), "vector is empty")
			return this._data[this.getSize() - 1]
		}

		pushBack(item) {
			assert(item)
			this._data.push(item)
		}

		popBack() {
			assert(!this.isEmpty(), "vector is empty")
			return this._data.pop()
		}
	
		contains(value) {
		    return this.findPos(value) !== undefined
		}
	
		containsBy(predicate) {
		    return this.findPosBy(predicate) !== undefined
		}

		remove(index) {
		    if (index < 0 || index >= this.getSize())
		        raise(`index out of bounds: ${index}`)
		    return this._data.splice(index, 1)[0]
		}

		removeBy(predicate) {
			const index = this.findPosBy(predicate)
			if (!index)
				return undefined
			return this.remove(index)
		}

		removeByValue(value) {
			const removedValue = this.removeByValueNoThrow(value)
			if (!removedValue)
				error(`value not found '${value}'`)
			return removedValue
		}

		removeByValueNoThrow(value) {
			const index = this.findPos(value)
			if (!index)
				return undefined
			return this.remove(index)
		}

		sort(predicate = undefined) {
			this._data.sort(predicate)
		}

	}

	class Map extends Container {
		_data

		constructor(...args) {
			super()
			this._data = new globalThis.Map(...args)
		}
	
		*[Symbol.iterator]() {
			for (const element of this._data)
				yield element
		}

		keys() {
			return new Vector(...this._data.keys())
		}

		values() {
			return new Vector(...this._data.values())
		}

		set(key, value) {
			if (!this._data.has(key))
				raise(`Key does not exist: ${key}`)
			assert(value !== undefined)
			this._data.set(key, value)
		}

		create(key, value) {
			if (this._data.has(key))
				raise(`Key already exists: ${key}=${value}`)
			assert(value !== undefined)
			this._data.set(key, value)
		}

		setOrCreate(key, value) {
			assert(value !== undefined)
			this._data.set(key, value)
		}

		get(key) {
			if (!this._data.has(key))
				raise(`Key not found: ${key}`)
			return this._data.get(key)
		}

		find(key) {
			return this._data.get(key)
		}

		findKeyByValue(toFind) {
			for (const [key, value] of this._data)
				if (value == toFind)
					return key
			return undefined
		}

		findKeyBy(predicate) {
			for (const [key, value] of this._data)
				if (predicate(key, value))
					return key
			return undefined
		}

		remove(key) {
			if (!this._data.has(key))
				raise(`Invalid key: ${key}`)
			const value = this._data.get(key)
			this._data.delete(key)
			return value
		}

		tryRemove(key) {
			if (!this._data.has(key))
				return null
			const value = this._data.get(key)
			this._data.delete(key)
			return value
		}

		getSize() {
			return this._data.size
		}

		clear() {
			this._data.clear()
		}

		getData() {
			return this._data
		}

		forEach(predicate) {
			for (const [key, value] of this._data)
				predicate(key, value)
		}

		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this.getSize())
			for (const [key, value] of this._data) {
				itemWritePredicate(writer, key, value)
			}
		}

		readData(reader, sizeReadMethod, itemReadPredicate) {
			const count = sizeReadMethod(reader)
			this.clear()
			for (let i = 0; i < count; i++) {
				const [key, value] = itemReadPredicate(reader)
				assert(key !== undefined)
				assert(value !== undefined)
				this._data.set(key, value)
			}
		}
	}

	class Set extends Container {
		_data

		constructor(...args) {
			super()
			this._data = new globalThis.Set(...args)
		}

		*[Symbol.iterator]() {
			for (const element of this._data)
				yield element
		}

		toVector() {
			return new Vector(...this._data)
		}
	
		tryInsert(value) {
			assert(value !== undefined)
			const had = this.has(value)
			this._data.add(value)
			return !had
		}

		insert(value) {
			const inserted = this.tryInsert(value)
			if (!inserted)
				raise("duplicate element")
		}

		has(value) {
			return this._data.has(value)
		}

		remove(value) {
			if (!this.tryRemove(value))
				raise("element does not exist")
			return true
		}

		tryRemove(value) {
			return this._data.delete(value)
		}

		getSize() {
			return this._data.size
		}

		clear() {
			this._data.clear()
		}

		forEach(predicate) {
			for (const value of this._data)
				predicate(value)
		}
	
		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this.getSize())
			for (const value of this._data)
				itemWritePredicate(writer, value)
		}

		readData(reader, sizeReadMethod, itemReadPredicate) {
			const count = sizeReadMethod(reader)
			this.clear()
			for (let i = 0; i < count; i++) {
				const value = itemReadPredicate(reader)
				assert(value !== undefined)
				this._data.add(value)
			}
		}
	}

	class Stack extends _ArrayLike {

		constructor(...args) {
			super(...args)
		}

		push(value) {
			assert(value !== undefined)
			this._data.push(value)
		}

		pop() {
			if (this.isEmpty())
				raise("stack underflow")
			return this._data.pop()
		}

		top() {
			assert(!this.isEmpty(), "stack is empty")
			return this._data[this.getSize() - 1]
		}
	}

	class Queue extends _ArrayLike {

		constructor(...args) {
			super(...args)
		}

		enqueue(value) {
			assert(value !== undefined)
			this._data.push(value)
		}

		dequeue() {
			if (this.isEmpty())
				raise("queue underflow")
			return this._data.shift()
		}

		front() {
			if (this.isEmpty())
				raise("queue is empty")
			return this._data[0]
		}

		back() {
			if (this.isEmpty())
				raise("queue is empty")
			return this._data[this.getSize() - 1]
		}
	}

	if (module !== undefined && module.exports) {
		module.exports = { Container, Vector, Map, Set, Stack, Queue }
	}

	// ------------------------------------------------------------------------
	// BinaryIO.js
	// ------------------------------------------------------------------------
	const __BinaryContainer_decoder_utf = new TextDecoder('utf-8')
	const __BinaryContainer_decoder_ascii = new TextDecoder('ascii')
	const __BinaryContainer_encoder = new TextEncoder()

	function clearBinaryHexData(hexString) {
		return hexString
			.replace(/\s+/g, '')
			.replace(/^0x/i, '')
			.replace(/[^0-9a-fA-F]/g, '')
	}

	class BinaryContainer {
		constructor() {
			this.data = null
			this.view = null
			this.size = 0
			this.capacity = 0
		}

		create(capacity) {
			this.data = new Uint8Array(capacity)
			this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength)
			this.capacity = capacity
		}

		reserve(newCapacity) {
			if (newCapacity > this.capacity) {
				const newData = new Uint8Array(newCapacity)
				newData.set(this.data.subarray(0, this.capacity), 0)
				this.data = newData
				this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength)
				this.capacity = newCapacity
			}
		}

		reallocate(newCapacity) {
			const newData = new Uint8Array(newCapacity)
			newData.set(this.data.subarray(0, this.size), 0)
			this.data = newData
			this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength)
			this.capacity = newCapacity
		}

		toHex() {
			let result = ''
			for (let i = 0; i < this.size; i++) {
				const byte = this.data[i]
				const hex = byte.toString(16).padStart(2, '0')
				result += hex + ' '
			}
			return result
		}

		assignHex(hexStr) {
			const clean = clearBinaryHexData(hexStr)
			if (clean.length % 2 !== 0)
				throw new Error("Hex string has odd length")

			const buf = new Uint8Array(clean.length / 2)
			for (let i = 0; i < clean.length; i += 2)
				buf[i / 2] = parseInt(clean.slice(i, i + 2), 16)
		
			this.data = buf
			this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
			this.size = buf.length
			this.capacity = buf.length
			return this
		}

		toAscii() {
			return __BinaryContainer_decoder_ascii.decode(this.data.subarray(0, this.size))
		}

		assignAscii(str) {
			const bytes = new Uint8Array(str.length)
			for (let i = 0; i < str.length; i++) {
				bytes[i] = str.charCodeAt(i) & 0xFF
			}

			this.data = bytes
			this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
			this.size = bytes.length
			this.capacity = bytes.length
			return this
		}
	}

	class BinaryReader extends BinaryContainer {
		constructor(data = null) {
			super()
			if (data) {
				this.data = data
				this.view = new DataView(data.buffer, data.byteOffset, data.byteLength)
				this.size = data.length
			}
			this.position = 0
		}

		skip(bytes) {
			this.position += bytes
			if (this.position > this.size)
				throw new Error("Cannot skip past end of buffer")
			return this
		}

		align(alignment) {
			const offset = this.position % alignment
			if (offset !== 0)
				this.position += alignment - offset
			return this
		}

		tell() { return this.position }

		seek(pos) {
			if (pos < 0 || pos > this.size) {
				throw new Error(`Invalid seek position: ${pos}`)
			}
			this.position = pos
			return this
		}

		setBuffer(data) {
			this.data = data
			this.view = new DataView(data.buffer, data.byteOffset, data.byteLength)
			this.position = 0
			this.size = data.length
		}

		readU8() {
			const value = this.data[this.position]
			this.position += 1
			return value
		}

		readU16() {
			const value = this.view.getUint16(this.position, true)
			this.position += 2
			return value
		}

		readU32() {
			const value = this.view.getUint32(this.position, true)
			this.position += 4
			return value
		}

		readI8() {
			const value = this.view.getInt8(this.position)
			this.position += 1
			return value
		}

		readI16() {
			const value = this.view.getInt16(this.position, true)
			this.position += 2
			return value
		}

		readI32() {
			const value = this.view.getInt32(this.position, true)
			this.position += 4
			return value
		}

		readF32() {
			const value = this.view.getFloat32(this.position, true)
			this.position += 4
			return value
		}

		readF64() {
			const value = this.view.getFloat64(this.position, true)
			this.position += 8
			return value
		}

		readStringOfSize(size) {
			const value = __BinaryContainer_decoder_utf.decode(this.data.subarray(this.position, this.position + size))
			this.position += size
			return value
		}

		readStringU8() {
			const size = this.readU8()
			return this.readStringOfSize(size)
		}

		readStringU16() {
			const size = this.readU16()
			return this.readStringOfSize(size)
		}

		readStringU32() {
			const size = this.readU32()
			return this.readStringOfSize(size)
		}

		readString() {
			return this.readStringU32()
		}

		readCString() {
			const start = this.position
			let cursor = start

			while (cursor < this.size && this.data[cursor] !== 0)
				cursor += 1

			if (cursor === this.size)
				throw new Error('string is not null-terminated')

			const value = __BinaryContainer_decoder_utf.decode(this.data.subarray(start, cursor))
			this.position = cursor + 1
			return value
		}

		readBool() {
			return this.readU8() !== 0
		}

		readVector2F32() {
			return {
				x: this.readF32(),
				y: this.readF32()
			}
		}

		readVector2I16() {
			return {
				x: this.readI16(),
				y: this.readI16()
			}
		}

		readVector2I32() {
			return {
				x: this.readI32(),
				y: this.readI32()
			}
		}

		readVector3F32() {
			return {
				x: this.readF32(),
				y: this.readF32(),
				z: this.readF32()
			}
		}

		readVector3I16() {
			return {
				x: this.readI16(),
				y: this.readI16(),
				z: this.readI16()
			}
		}

		readVector3I32() {
			return {
				x: this.readI32(),
				y: this.readI32(),
				z: this.readI32()
			}
		}
	
		readVector4F32() {
			return {
				x: this.readF32(),
				y: this.readF32(),
				z: this.readF32(),
				w: this.readF32()
			}
		}
	
		readVector4I16() {
			return {
				x: this.readI16(),
				y: this.readI16(),
				z: this.readI16(),
				w: this.readI16()
			}
		}

		readVector4I32() {
			return {
				x: this.readI32(),
				y: this.readI32(),
				z: this.readI32(),
				w: this.readI32()
			}
		}

		readColor3F32() {
			return {
				r: this.readF32(),
				g: this.readF32(),
				b: this.readF32()
			}
		}

		readColor3U8() {
			return {
				r: this.readU8() / 255,
				g: this.readU8() / 255,
				b: this.readU8() / 255
			}
		}

		readCFrame() {
			const x = this.readF32()
			const y = this.readF32()
			const z = this.readF32()
			const rx = this.readF32()
			const ry = this.readF32()
			const rz = this.readF32()

			return {
				position: { x, y, z },
				rotation: { x: rx, y: ry, z: rz }
			}
		}

		readVarInt() {
			let value = 0
			let shift = 0
		
			while (true) {
				const byte = this.readU8()
				value += (byte & 127) << shift
				if ((byte & 128) === 0) {
					break
				}
				shift += 7
			}
		
			return value
		}
	}

	class BinaryWriter extends BinaryContainer {
		constructor() {
			super()
		}

		_reserveGrow(size) {
			const currentSize = this.size
			const currentCapacity = this.capacity
			const newSize = currentSize + size

			if (newSize > currentCapacity) {
				const newData = new Uint8Array(newSize)
				if (this.data) {
					newData.set(this.data.subarray(0, currentSize), 0)
				}
				this.data = newData
				this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength)
				this.size = newSize
				this.capacity = newSize
			} else {
				this.size = newSize
			}

			return currentSize
		}

		writeU8(value) {
			const currentSize = this._reserveGrow(1)
			this.data[currentSize] = value
			return this
		}

		writeU16(value) {
			const currentSize = this._reserveGrow(2)
			this.view.setUint16(currentSize, value, true)
			return this
		}

		writeU32(value) {
			const currentSize = this._reserveGrow(4)
			this.view.setUint32(currentSize, value, true)
			return this
		}

		writeI8(value) {
			const currentSize = this._reserveGrow(1)
			this.view.setInt8(currentSize, value)
			return this
		}

		writeI16(value) {
			const currentSize = this._reserveGrow(2)
			this.view.setInt16(currentSize, value, true)
			return this
		}

		writeI32(value) {
			const currentSize = this._reserveGrow(4)
			this.view.setInt32(currentSize, value, true)
			return this
		}

		writeF32(value) {
			const currentSize = this._reserveGrow(4)
			this.view.setFloat32(currentSize, value, true)
			return this
		}

		writeF64(value) {
			const currentSize = this._reserveGrow(8)
			this.view.setFloat64(currentSize, value, true)
			return this
		}

		writeBool(value) {
			this.writeU8(value ? 1 : 0)
			return this
		}

		writeStringOfSize(source, stringSize) {
			const currentSize = this._reserveGrow(stringSize)
			const encoded = __BinaryContainer_encoder.encode(source)
			this.data.set(encoded.subarray(0, stringSize), currentSize)
			return this
		}

		writeStringU8(source) {
			const encoded = __BinaryContainer_encoder.encode(source)
			this.writeU8(encoded.length)
			const currentSize = this._reserveGrow(encoded.length)
			this.data.set(encoded, currentSize)
			return this
		}

		writeStringU16(source) {
			const encoded = __BinaryContainer_encoder.encode(source)
			this.writeU16(encoded.length)
			const currentSize = this._reserveGrow(encoded.length)
			this.data.set(encoded, currentSize)
			return this
		}

		writeStringU32(source) {
			const encoded = __BinaryContainer_encoder.encode(source)
			this.writeU32(encoded.length)
			const currentSize = this._reserveGrow(encoded.length)
			this.data.set(encoded, currentSize)
			return this
		}

		writeString(source) {
			return this.writeStringU32(source)
		}

		writeCString(source) {
			const encoded = __BinaryContainer_encoder.encode(source)
			const currentSize = this._reserveGrow(encoded.length + 1)
			this.data.set(encoded, currentSize)
			this.data[currentSize + encoded.length] = 0
			return this
		}

		writeVector2F32(value) {
			this.writeF32(value.x)
			this.writeF32(value.y)
			return this
		}

		writeVector2I16(value) {
			this.writeI16(value.x)
			this.writeI16(value.y)
			return this
		}

		writeVector2I32(value) {
			this.writeI32(value.x)
			this.writeI32(value.y)
			return this
		}

		writeVector3F32(value) {
			this.writeF32(value.x)
			this.writeF32(value.y)
			this.writeF32(value.z)
			return this
		}

		writeVector3I16(value) {
			this.writeI16(value.x)
			this.writeI16(value.y)
			this.writeI16(value.z)
			return this
		}

		writeVector3I32(value) {
			this.writeI32(value.x)
			this.writeI32(value.y)
			this.writeI32(value.z)
			return this
		}
	
		writeVector4F32(v) {
			this.writeF32(v.x)
			this.writeF32(v.y)
			this.writeF32(v.z)
			this.writeF32(v.w)
			return this
		}
	
		writeVector4I16(v) {
			this.writeI16(v.x)
			this.writeI16(v.y)
			this.writeI16(v.z)
			this.writeI16(v.w)
			return this
		}
	
		writeVector4I32(v) {
			this.writeI32(v.x)
			this.writeI32(v.y)
			this.writeI32(v.z)
			this.writeI32(v.w)
			return this
		}

		writeColor3F32(value) {
			this.writeF32(value.r)
			this.writeF32(value.g)
			this.writeF32(value.b)
			return this
		}

		writeColor3U8(value) {
			this.writeU8(Math.round(value.r * 255))
			this.writeU8(Math.round(value.g * 255))
			this.writeU8(Math.round(value.b * 255))
			return this
		}

		writeColor4F32(c) {
			this.writeF32(c.r)
			this.writeF32(c.g)
			this.writeF32(c.b)
			this.writeF32(c.a)
			return this
		}

		writeColor4U8(c) {
			this.writeU8(Math.round(c.r * 255))
			this.writeU8(Math.round(c.g * 255))
			this.writeU8(Math.round(c.b * 255))
			this.writeU8(Math.round(c.a * 255))
			return this
		}

		writeCFrame(value) {
			const pos = value.position
			const rot = value.rotation

			this.writeF32(pos.x)
			this.writeF32(pos.y)
			this.writeF32(pos.z)
			this.writeF32(rot.x)
			this.writeF32(rot.y)
			this.writeF32(rot.z)
			return this
		}

		writeVarInt(value) {
			let size = 0
			let temp = value

			while (temp >= 128) {
				size += 1
				temp = temp >> 7
			}
			size += 1

			const currentSize = this._reserveGrow(size)
			let bitPosition = 0

			temp = value
			while (temp >= 128) {
				const byte = (temp & 127) | 128
				this.data[currentSize + bitPosition] = byte
				bitPosition += 1
				temp = temp >> 7
			}

			this.data[currentSize + bitPosition] = temp
			return this
		}

		padToAlignment(alignment = 4, fill = 0) {
			const offset = this.size % alignment
			if (offset !== 0) {
				const bytesToAdd = alignment - offset
				for (let i = 0; i < bytesToAdd; i++)
					this.writeU8(fill)
			}
			return this
		}

		writeByteRepeated(source, count) {
			const encoded = __BinaryContainer_encoder.encode(source.repeat(count))
			const currentSize = this._reserveGrow(encoded.length)
			this.data.set(encoded, currentSize)
			return this
		}

		writeZeros(count) {
			const currentSize = this._reserveGrow(count)
			this.data.fill(0, currentSize, currentSize + count)
			return this
		}

		toString() {
			return __BinaryContainer_decoder_utf.decode(this.data.subarray(0, this.size))
		}
	}

		const ValueType = {
			NULL: 0,
			BOOLEAN: 1,
			NUMBER: 2,
			STRING: 3,
			ARRAY: 4,
			OBJECT: 5,
			UINT8: 6,
			INT8: 7,
			UINT16: 8,
			INT16: 9,
			UINT32: 10,
			INT32: 11,
			FLOAT32: 12,
			FLOAT64: 13,
		}

		class BinaryReaderTyped {
			constructor(reader) {
				this.reader = reader
			}

			readValue() {
				const typeId = this.reader.readU8()

				switch (typeId) {
					case ValueType.NULL:
						return null
					case ValueType.BOOLEAN:
						return this.reader.readBool()
					case ValueType.NUMBER:
						return this.reader.readF64()
					case ValueType.STRING:
						return this.reader.readString()
					case ValueType.UINT8:
						return this.reader.readU8()
					case ValueType.INT8:
						return this.reader.readI8()
					case ValueType.UINT16:
						return this.reader.readU16()
					case ValueType.INT16:
						return this.reader.readI16()
					case ValueType.UINT32:
						return this.reader.readU32()
					case ValueType.INT32:
						return this.reader.readI32()
					case ValueType.FLOAT32:
						return this.reader.readF32()
					case ValueType.FLOAT64:
						return this.reader.readF64()
					case ValueType.ARRAY:
						const length = this.reader.readU32()
						const array = []
						for (let i = 0; i < length; i++) {
							array.push(this.readValue())
						}
						return array
					case ValueType.OBJECT:
						const entries = this.reader.readU32()
						const object = {}
						for (let i = 0; i < entries; i++) {
							const key = this.readValue()
							const val = this.readValue()
							object[key] = val
						}
						return object
					default:
						throw new Error(`Unknown value type: ${typeId}`)
				}
			}
		}

		class BinaryWriterTyped {
			constructor(writer) {
				this.writer = writer
			}

			writeValue(value) {
				if (value === null) {
					this.writer.writeU8(ValueType.NULL)
				} else if (typeof value === 'boolean') {
					this.writer.writeU8(ValueType.BOOLEAN)
					this.writer.writeBool(value)
				} else if (typeof value === 'number') {
					// Determine the most appropriate numeric type
					if (Number.isInteger(value)) {
						if (value >= 0 && value <= 255) {
							this.writer.writeU8(ValueType.UINT8)
							this.writer.writeU8(value)
						} else if (value >= -128 && value <= 127) {
							this.writer.writeU8(ValueType.INT8)
							this.writer.writeI8(value)
						} else if (value >= 0 && value <= 65535) {
							this.writer.writeU8(ValueType.UINT16)
							this.writer.writeU16(value)
						} else if (value >= -32768 && value <= 32767) {
							this.writer.writeU8(ValueType.INT16)
							this.writer.writeI16(value)
						} else if (value >= 0 && value <= 4294967295) {
							this.writer.writeU8(ValueType.UINT32)
							this.writer.writeU32(value)
						} else if (value >= -2147483648 && value <= 2147483647) {
							this.writer.writeU8(ValueType.INT32)
							this.writer.writeI32(value)
						} else {
							this.writer.writeU8(ValueType.FLOAT64)
							this.writer.writeF64(value)
						}
					} else {
						// For floats, use F32 if precision allows, otherwise F64
						if (Math.abs(value) < 3.4e38 && !Number.isNaN(value)) {
							const f32 = new Float32Array([value])[0]
							if (f32 === value) {
								this.writer.writeU8(ValueType.FLOAT32)
								this.writer.writeF32(value)
							} else {
								this.writer.writeU8(ValueType.FLOAT64)
								this.writer.writeF64(value)
							}
						} else {
							this.writer.writeU8(ValueType.FLOAT64)
							this.writer.writeF64(value)
						}
					}
				} else if (typeof value === 'string') {
					this.writer.writeU8(ValueType.STRING)
					this.writer.writeString(value)
				} else if (Array.isArray(value)) {
					this.writer.writeU8(ValueType.ARRAY)
					this.writer.writeU32(array.length)
					for (const item of array)
						this.writeValue(item)
				} else if (typeof value === 'object') {
					this.writer.writeU8(ValueType.OBJECT)
					const entries = Object.entries(object)
					this.writer.writeU32(entries.length)
					for (const [key, val] of entries) {
						this.writeValue(key)
						this.writeValue(val)
					}
				} else {
					throw new Error(`Cannot serialize value of type: ${typeof value}`)
				}

				return this
			}
		}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = { BinaryContainer, BinaryReader, BinaryWriter, BinaryReaderTyped, BinaryWriterTyped, clearBinaryHexData }
	}


	// --- exports ---
	return {
		raise,
		raise_typeerror,
		assert,
		istype,
		expecttype,
		expectinstanceof,
		Container,
		Vector,
		Map,
		Set,
		Stack,
		Queue,
		BinaryContainer,
		BinaryReader,
		BinaryWriter,
		BinaryReaderTyped,
		BinaryWriterTyped,
		clearBinaryHexData,
	}
})()