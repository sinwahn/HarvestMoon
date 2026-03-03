// HarvestMoon - auto-generated (BinaryIO.js)
// DO NOT EDIT

const HM = (() => {
    'use strict'
	const __BinaryContainer_decoder_utf = new TextDecoder('utf-8')
	const __BinaryContainer_decoder_ascii = new TextDecoder('ascii')
	const __BinaryContainer_encoder = new TextEncoder()
	function clearBinaryHexData(hexString) {
		return hexString
			.replace(/\s+/g, '')
			.replace(/^0x/i, '')
			.replace(/[^0-9a-fA-F]/g, '')
	}

	/**
	 * Shared base for all binary reader and writer classes.
	 * Holds the underlying Uint8Array, a DataView over it, and tracks size and capacity.
	 */
	class BinaryContainer {
		constructor() {
			this.data = null
			this.view = null
			this.size = 0
			this.capacity = 0
		}

		/**
		 * Allocates a fresh buffer of `capacity` bytes, discarding any existing data.
		 * @param {number} capacity
		 */
		create(capacity) {
			this.data = new Uint8Array(capacity)
			this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength)
			this.capacity = capacity
		}

		/**
		 * Grows the buffer to at least `newCapacity` bytes, preserving existing data.
		 * Does nothing if the current capacity already covers the request.
		 * @param {number} newCapacity
		 */
		reserve(newCapacity) {
			if (newCapacity > this.capacity) {
				const newData = new Uint8Array(newCapacity)
				newData.set(this.data.subarray(0, this.capacity), 0)
				this.data = newData
				this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength)
				this.capacity = newCapacity
			}
		}
	
		/**
		 * Reallocates the buffer to exactly `newCapacity` bytes.
		 * Trims or extends without any geometric growth. Written data up to `size` is preserved.
		 * @param {number} newCapacity
		 */
		reallocate(newCapacity) {
			const newData = new Uint8Array(newCapacity)
			newData.set(this.data.subarray(0, this.size), 0)
			this.data = newData
			this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength)
			this.capacity = newCapacity
		}

		/**
		 * Returns the written bytes as a space-separated hex string, e.g. `"01 ff a0 "`.
		 * @returns {string}
		 */
		toHex() {
			let result = ''
			for (let i = 0; i < this.size; i++) {
				const byte = this.data[i]
				const hex = byte.toString(16).padStart(2, '0')
				result += hex + ' '
			}
			return result
		}

		/**
		 * Loads the buffer from a hex string. Whitespace and a leading `0x` are ignored.
		 * Replaces any existing contents.
		 * @param {string} hexStr
		 * @returns {this}
		 */
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

		/**
		 * Returns the written bytes decoded as ASCII.
		 * @returns {string}
		 */
		toAscii() {
			return __BinaryContainer_decoder_ascii.decode(this.data.subarray(0, this.size))
		}

		/**
		 * Loads the buffer from an ASCII string, one byte per character.
		 * Characters above U+00FF are truncated to their low byte.
		 * Replaces any existing contents.
		 * @param {string} str
		 * @returns {this}
		 */
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

	/**
	 * Reads primitive types from a fixed byte buffer.
	 * All multi-byte values are read as little-endian.
	 *
	 * Not intended for direct use in most cases — prefer {@link BinaryReader},
	 * which adds structured types (vectors, colors, strings, etc.).
	 */
	class BinaryReaderPrimitive extends BinaryContainer {
		/**
		 * @param {Uint8Array|null} data Optional buffer to read from immediately.
		 */
		constructor(data = null) {
			super()
			if (data) {
				this.data = data
				this.view = new DataView(data.buffer, data.byteOffset, data.byteLength)
				this.size = data.length
			}
			this.position = 0
		}

		/**
		 * Advances the read position by `bytes` without reading anything.
		 * Throws if skipping would go past the end.
		 * @param {number} bytes
		 * @returns {this}
		 */
		skip(bytes) {
			this.position += bytes
			if (this.position > this.size)
				throw new Error("Cannot skip past end of buffer")
			return this
		}

		/**
		 * Advances the read position forward to the next multiple of `alignment`.
		 * Does nothing if the position is already aligned.
		 * @param {number} alignment
		 * @returns {this}
		 */
		align(alignment) {
			const offset = this.position % alignment
			if (offset !== 0)
				this.position += alignment - offset
			return this
		}

		/** Returns the current read position. */
		tell() { return this.position }

		/**
		 * Moves the read position to `pos`.
		 * Throws if `pos` is negative or beyond the buffer.
		 * @param {number} pos
		 * @returns {this}
		 */
		seek(pos) {
			if (pos < 0 || pos > this.size)
				throw new Error(`Invalid seek position: ${pos}`)
			this.position = pos
			return this
		}

		/**
		 * Replaces the buffer and resets the read position to 0.
		 * @param {Uint8Array} data
		 */
		setBuffer(data) {
			this.data = data
			this.view = new DataView(data.buffer, data.byteOffset, data.byteLength)
			this.position = 0
			this.size = data.length
		}

		/** Reads 1 byte as an unsigned 8-bit integer. */
		readU8() {
			return this.data[this.position++]
		}

		/** Reads 2 bytes as an unsigned 16-bit little-endian integer. */
		readU16() {
			const value = this.view.getUint16(this.position, true)
			this.position += 2
			return value
		}

		/** Reads 4 bytes as an unsigned 32-bit little-endian integer. */
		readU32() {
			const value = this.view.getUint32(this.position, true)
			this.position += 4
			return value
		}

		/** Reads 1 byte as a signed 8-bit integer. */
		readI8() {
			return this.view.getInt8(this.position++)
		}

		/** Reads 2 bytes as a signed 16-bit little-endian integer. */
		readI16() {
			const value = this.view.getInt16(this.position, true)
			this.position += 2
			return value
		}

		/** Reads 4 bytes as a signed 32-bit little-endian integer. */
		readI32() {
			const value = this.view.getInt32(this.position, true)
			this.position += 4
			return value
		}

		/** Reads 4 bytes as a 32-bit little-endian float. */
		readF32() {
			const value = this.view.getFloat32(this.position, true)
			this.position += 4
			return value
		}

		/** Reads 8 bytes as a 64-bit little-endian float. */
		readF64() {
			const value = this.view.getFloat64(this.position, true)
			this.position += 8
			return value
		}

		/** Reads 1 byte and returns `true` if it is non-zero. */
		readBool() {
			return this.data[this.position++] !== 0
		}

		/**
		 * Reads a variable-length unsigned integer encoded in LEB128 format.
		 * Consumes 1–5 bytes depending on the value.
		 * @returns {number}
		 */
		readVarInt() {
			let value = 0
			let shift = 0
			while (true) {
				const byte = this.data[this.position++]
				value += (byte & 127) << shift
				if ((byte & 128) === 0) break
				shift += 7
			}
			return value
		}

		/**
		 * Reads exactly `size` bytes and decodes them as a UTF-8 string.
		 * Does not read a length prefix — use one of the `readStringXxx` methods for that.
		 * @param {number} size
		 * @returns {string}
		 */
		readStringOfSize(size) {
			const value = __decoder_utf.decode(this.data.subarray(this.position, this.position + size))
			this.position += size
			return value
		}
	}

	/**
	 * Extends {@link BinaryReaderPrimitive} with structured types:
	 * length-prefixed strings, null-terminated strings, 2D/3D/4D vectors,
	 * colors, and CFrames.
	 *
	 * All structured methods read directly from the buffer — they do not call
	 * the primitive `readXxx` methods. This is intentional: {@link DebugBinaryReader}
	 * overrides the individual primitives to enforce opcode tags, and structured reads
	 * must not trigger those assertions on their internal component reads.
	 */
	class BinaryReader extends BinaryReaderPrimitive {

		/** Reads a U8-prefixed length, then that many bytes as a UTF-8 string. */
		readStringU8() {
			const size = this.data[this.position++]
			return this.readStringOfSize(size)
		}

		/** Reads a U16-prefixed length, then that many bytes as a UTF-8 string. */
		readStringU16() {
			const size = this.view.getUint16(this.position, true)
			this.position += 2
			return this.readStringOfSize(size)
		}

		/** Reads a U32-prefixed length, then that many bytes as a UTF-8 string. */
		readStringU32() {
			const size = this.view.getUint32(this.position, true)
			this.position += 4
			return this.readStringOfSize(size)
		}

		/**
		 * Reads a length-prefixed UTF-8 string using the default U32 prefix.
		 * Mirrors {@link BinaryWriter#writeString}.
		 */
		readString() {
			return this.readStringU32()
		}

		/**
		 * Reads bytes until a null terminator (`0x00`) and decodes them as UTF-8.
		 * The null byte is consumed but not included in the returned string.
		 * Throws if the buffer ends before a null byte is found.
		 */
		readCString() {
			const start = this.position
			let cursor = start
			while (cursor < this.size && this.data[cursor] !== 0)
				cursor++
			if (cursor === this.size)
				throw new Error('string is not null-terminated')
			const value = __decoder_utf.decode(this.data.subarray(start, cursor))
			this.position = cursor + 1
			return value
		}

		/** Reads two F32s as `{ x, y }`. */
		readVector2F32() {
			const x = this.view.getFloat32(this.position, true)
			const y = this.view.getFloat32(this.position + 4, true)
			this.position += 8
			return { x, y }
		}

		/** Reads two I16s as `{ x, y }`. */
		readVector2I16() {
			const x = this.view.getInt16(this.position, true)
			const y = this.view.getInt16(this.position + 2, true)
			this.position += 4
			return { x, y }
		}

		/** Reads two I32s as `{ x, y }`. */
		readVector2I32() {
			const x = this.view.getInt32(this.position, true)
			const y = this.view.getInt32(this.position + 4, true)
			this.position += 8
			return { x, y }
		}

		/** Reads three F32s as `{ x, y, z }`. */
		readVector3F32() {
			const x = this.view.getFloat32(this.position, true)
			const y = this.view.getFloat32(this.position + 4, true)
			const z = this.view.getFloat32(this.position + 8, true)
			this.position += 12
			return { x, y, z }
		}

		/** Reads three I16s as `{ x, y, z }`. */
		readVector3I16() {
			const x = this.view.getInt16(this.position, true)
			const y = this.view.getInt16(this.position + 2, true)
			const z = this.view.getInt16(this.position + 4, true)
			this.position += 6
			return { x, y, z }
		}

		/** Reads three I32s as `{ x, y, z }`. */
		readVector3I32() {
			const x = this.view.getInt32(this.position, true)
			const y = this.view.getInt32(this.position + 4, true)
			const z = this.view.getInt32(this.position + 8, true)
			this.position += 12
			return { x, y, z }
		}

		/** Reads four F32s as `{ x, y, z, w }`. */
		readVector4F32() {
			const x = this.view.getFloat32(this.position, true)
			const y = this.view.getFloat32(this.position + 4, true)
			const z = this.view.getFloat32(this.position + 8, true)
			const w = this.view.getFloat32(this.position + 12, true)
			this.position += 16
			return { x, y, z, w }
		}

		/** Reads four I16s as `{ x, y, z, w }`. */
		readVector4I16() {
			const x = this.view.getInt16(this.position, true)
			const y = this.view.getInt16(this.position + 2, true)
			const z = this.view.getInt16(this.position + 4, true)
			const w = this.view.getInt16(this.position + 6, true)
			this.position += 8
			return { x, y, z, w }
		}

		/** Reads four I32s as `{ x, y, z, w }`. */
		readVector4I32() {
			const x = this.view.getInt32(this.position, true)
			const y = this.view.getInt32(this.position + 4, true)
			const z = this.view.getInt32(this.position + 8, true)
			const w = this.view.getInt32(this.position + 12, true)
			this.position += 16
			return { x, y, z, w }
		}

		/** Reads three F32s as `{ r, g, b }` in [0, 1] range. */
		readColor3F32() {
			const r = this.view.getFloat32(this.position, true)
			const g = this.view.getFloat32(this.position + 4, true)
			const b = this.view.getFloat32(this.position + 8, true)
			this.position += 12
			return { r, g, b }
		}

		/** Reads three U8s as `{ r, g, b }` normalized to [0, 1]. */
		readColor3U8() {
			const r = this.data[this.position] / 255
			const g = this.data[this.position + 1] / 255
			const b = this.data[this.position + 2] / 255
			this.position += 3
			return { r, g, b }
		}

		/** Reads four F32s as `{ r, g, b, a }` in [0, 1] range. */
		readColor4F32() {
			const r = this.view.getFloat32(this.position, true)
			const g = this.view.getFloat32(this.position + 4, true)
			const b = this.view.getFloat32(this.position + 8, true)
			const a = this.view.getFloat32(this.position + 12, true)
			this.position += 16
			return { r, g, b, a }
		}

		/** Reads four U8s as `{ r, g, b, a }` normalized to [0, 1]. */
		readColor4U8() {
			const r = this.data[this.position] / 255
			const g = this.data[this.position + 1] / 255
			const b = this.data[this.position + 2] / 255
			const a = this.data[this.position + 3] / 255
			this.position += 4
			return { r, g, b, a }
		}

		/**
		 * Reads six F32s as a CFrame: `{ position: {x,y,z}, rotation: {x,y,z} }`.
		 * Position is read first, then Euler rotation angles.
		 */
		readCFrame() {
			const px = this.view.getFloat32(this.position, true)
			const py = this.view.getFloat32(this.position + 4, true)
			const pz = this.view.getFloat32(this.position + 8, true)
			const rx = this.view.getFloat32(this.position + 12, true)
			const ry = this.view.getFloat32(this.position + 16, true)
			const rz = this.view.getFloat32(this.position + 20, true)
			this.position += 24
			return { position: { x: px, y: py, z: pz }, rotation: { x: rx, y: ry, z: rz } }
		}
	}

	/**
	 * Writes primitive types to a dynamically-growing byte buffer.
	 * All multi-byte values are written as little-endian.
	 * The buffer grows geometrically (doubles) to amortise allocations.
	 *
	 * Not intended for direct use in most cases — prefer {@link BinaryWriter},
	 * which adds structured types (vectors, colors, strings, etc.).
	 */
	class BinaryWriterPrimitive extends BinaryContainer {

		/**
		 * Ensures the buffer has room for `size` more bytes, growing geometrically if needed.
		 * Returns the byte offset at which to write the new data.
		 * @param {number} size
		 * @returns {number} offset of the newly reserved region
		 */
		_reserveGrow(size) {
			const currentSize = this.size
			const currentCapacity = this.capacity
			const newSize = currentSize + size

			if (newSize > currentCapacity) {
				const newData = new Uint8Array(Math.max(newSize, currentCapacity * 2))
				if (this.data)
					newData.set(this.data.subarray(0, currentSize), 0)
				this.data = newData
				this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength)
				this.capacity = newData.length // BUG FIX: was newSize, discarding the doubled headroom
			}

			this.size = newSize
			return currentSize
		}

		/** Writes `value` as an unsigned 8-bit integer (1 byte). */
		writeU8(value) {
			const offset = this._reserveGrow(1)
			this.data[offset] = value
			return this
		}

		/** Writes `value` as an unsigned 16-bit little-endian integer (2 bytes). */
		writeU16(value) {
			const offset = this._reserveGrow(2)
			this.view.setUint16(offset, value, true)
			return this
		}

		/** Writes `value` as an unsigned 32-bit little-endian integer (4 bytes). */
		writeU32(value) {
			const offset = this._reserveGrow(4)
			this.view.setUint32(offset, value, true)
			return this
		}

		/** Writes `value` as a signed 8-bit integer (1 byte). */
		writeI8(value) {
			const offset = this._reserveGrow(1)
			this.view.setInt8(offset, value)
			return this
		}

		/** Writes `value` as a signed 16-bit little-endian integer (2 bytes). */
		writeI16(value) {
			const offset = this._reserveGrow(2)
			this.view.setInt16(offset, value, true)
			return this
		}

		/** Writes `value` as a signed 32-bit little-endian integer (4 bytes). */
		writeI32(value) {
			const offset = this._reserveGrow(4)
			this.view.setInt32(offset, value, true)
			return this
		}

		/** Writes `value` as a 32-bit little-endian float (4 bytes). */
		writeF32(value) {
			const offset = this._reserveGrow(4)
			this.view.setFloat32(offset, value, true)
			return this
		}

		/** Writes `value` as a 64-bit little-endian float (8 bytes). */
		writeF64(value) {
			const offset = this._reserveGrow(8)
			this.view.setFloat64(offset, value, true)
			return this
		}

		/** Writes `true` as `0x01` and `false` as `0x00` (1 byte). */
		writeBool(value) {
			const offset = this._reserveGrow(1)
			this.data[offset] = value ? 1 : 0
			return this
		}

		/**
		 * Writes `value` as a variable-length unsigned integer in LEB128 format.
		 * Uses 1–5 bytes depending on the magnitude of `value`.
		 * @param {number} value - non-negative integer
		 */
		writeVarInt(value) {
			// Pre-compute byte count so we can _reserveGrow once
			let temp = value
			let size = 0
			do { size++; temp >>= 7 } while (temp > 0)

			const offset = this._reserveGrow(size)
			temp = value
			let pos = 0
			while (temp >= 128) {
				this.data[offset + pos++] = (temp & 127) | 128
				temp >>= 7
			}
			this.data[offset + pos] = temp
			return this
		}

		/**
		 * Appends `count` zero bytes. Uses a single buffer reservation and a fill.
		 * @param {number} count
		 */
		writeZeros(count) {
			const offset = this._reserveGrow(count)
			this.data.fill(0, offset, offset + count)
			return this
		}

		/**
		 * Pads the buffer with `fill` bytes up to the next multiple of `alignment`.
		 * Does nothing if already aligned.
		 * @param {number} [alignment=4]
		 * @param {number} [fill=0]
		 */
		padToAlignment(alignment = 4, fill = 0) {
			const rem = this.size % alignment
			if (rem !== 0) {
				const count = alignment - rem
				const offset = this._reserveGrow(count)
				this.data.fill(fill, offset, offset + count)
			}
			return this
		}
	}

	/**
	 * Extends {@link BinaryWriterPrimitive} with structured types:
	 * length-prefixed strings, null-terminated strings, 2D/3D/4D vectors,
	 * colors, and CFrames.
	 *
	 * All structured methods call `_reserveGrow` once for the entire structure
	 * and write directly into the buffer — they do not call the primitive
	 * `writeXxx` methods. This is intentional: {@link DebugBinaryWriter}
	 * overrides the individual primitives to prepend opcode tags, and structured
	 * writes must not emit those tags for their internal component writes.
	 */
	class BinaryWriter extends BinaryWriterPrimitive {

		/**
		 * Writes a UTF-8 string prefixed with its byte length as a U8.
		 * Maximum string size: 255 bytes encoded.
		 * @param {string} source
		 */
		writeStringU8(source) {
			const encoded = __encoder.encode(source)
			const offset = this._reserveGrow(1 + encoded.length)
			this.data[offset] = encoded.length
			this.data.set(encoded, offset + 1)
			return this
		}

		/**
		 * Writes a UTF-8 string prefixed with its byte length as a U16.
		 * Maximum string size: 65535 bytes encoded.
		 * @param {string} source
		 */
		writeStringU16(source) {
			const encoded = __encoder.encode(source)
			const offset = this._reserveGrow(2 + encoded.length)
			this.view.setUint16(offset, encoded.length, true)
			this.data.set(encoded, offset + 2)
			return this
		}

		/**
		 * Writes a UTF-8 string prefixed with its byte length as a U32.
		 * @param {string} source
		 */
		writeStringU32(source) {
			const encoded = __encoder.encode(source)
			const offset = this._reserveGrow(4 + encoded.length)
			this.view.setUint32(offset, encoded.length, true)
			this.data.set(encoded, offset + 4)
			return this
		}

		/**
		 * Writes a length-prefixed UTF-8 string using the default U32 prefix.
		 * Mirrors {@link BinaryReader#readString}.
		 * @param {string} source
		 */
		writeString(source) {
			return this.writeStringU32(source)
		}

		/**
		 * Writes a UTF-8 string followed by a null terminator byte (`0x00`).
		 * Mirrors {@link BinaryReader#readCString}.
		 * @param {string} source
		 */
		writeCString(source) {
			const encoded = __encoder.encode(source)
			const offset = this._reserveGrow(encoded.length + 1)
			this.data.set(encoded, offset)
			this.data[offset + encoded.length] = 0
			return this
		}

		/**
		 * Writes a fixed number of bytes from the UTF-8 encoding of `source`.
		 * If the encoded string is shorter than `stringSize`, the remainder is left as
		 * whatever was previously in the buffer (zeros for fresh allocations).
		 * If longer, it is truncated to `stringSize` bytes.
		 * @param {string} source
		 * @param {number} stringSize exact number of bytes to reserve and write
		 */
		writeStringOfSize(source, stringSize) {
			const encoded = __encoder.encode(source)
			const offset = this._reserveGrow(stringSize)
			this.data.set(encoded.subarray(0, stringSize), offset)
			return this
		}

		/** Writes `{ x, y }` as two F32s (8 bytes). */
		writeVector2F32(v) {
			const offset = this._reserveGrow(8)
			this.view.setFloat32(offset, v.x, true)
			this.view.setFloat32(offset + 4, v.y, true)
			return this
		}

		/** Writes `{ x, y }` as two I16s (4 bytes). */
		writeVector2I16(v) {
			const offset = this._reserveGrow(4)
			this.view.setInt16(offset, v.x, true)
			this.view.setInt16(offset + 2, v.y, true)
			return this
		}

		/** Writes `{ x, y }` as two I32s (8 bytes). */
		writeVector2I32(v) {
			const offset = this._reserveGrow(8)
			this.view.setInt32(offset, v.x, true)
			this.view.setInt32(offset + 4, v.y, true)
			return this
		}

		/** Writes `{ x, y, z }` as three F32s (12 bytes). */
		writeVector3F32(v) {
			const offset = this._reserveGrow(12)
			this.view.setFloat32(offset, v.x, true)
			this.view.setFloat32(offset + 4, v.y, true)
			this.view.setFloat32(offset + 8, v.z, true)
			return this
		}

		/** Writes `{ x, y, z }` as three I16s (6 bytes). */
		writeVector3I16(v) {
			const offset = this._reserveGrow(6)
			this.view.setInt16(offset, v.x, true)
			this.view.setInt16(offset + 2, v.y, true)
			this.view.setInt16(offset + 4, v.z, true)
			return this
		}

		/** Writes `{ x, y, z }` as three I32s (12 bytes). */
		writeVector3I32(v) {
			const offset = this._reserveGrow(12)
			this.view.setInt32(offset, v.x, true)
			this.view.setInt32(offset + 4, v.y, true)
			this.view.setInt32(offset + 8, v.z, true)
			return this
		}

		/** Writes `{ x, y, z, w }` as four F32s (16 bytes). */
		writeVector4F32(v) {
			const offset = this._reserveGrow(16)
			this.view.setFloat32(offset, v.x, true)
			this.view.setFloat32(offset + 4, v.y, true)
			this.view.setFloat32(offset + 8, v.z, true)
			this.view.setFloat32(offset + 12, v.w, true)
			return this
		}

		/** Writes `{ x, y, z, w }` as four I16s (8 bytes). */
		writeVector4I16(v) {
			const offset = this._reserveGrow(8)
			this.view.setInt16(offset, v.x, true)
			this.view.setInt16(offset + 2, v.y, true)
			this.view.setInt16(offset + 4, v.z, true)
			this.view.setInt16(offset + 6, v.w, true)
			return this
		}

		/** Writes `{ x, y, z, w }` as four I32s (16 bytes). */
		writeVector4I32(v) {
			const offset = this._reserveGrow(16)
			this.view.setInt32(offset, v.x, true)
			this.view.setInt32(offset + 4, v.y, true)
			this.view.setInt32(offset + 8, v.z, true)
			this.view.setInt32(offset + 12, v.w, true)
			return this
		}

		/** Writes `{ r, g, b }` as three F32s in [0, 1] range (12 bytes). */
		writeColor3F32(v) {
			const offset = this._reserveGrow(12)
			this.view.setFloat32(offset, v.r, true)
			this.view.setFloat32(offset + 4, v.g, true)
			this.view.setFloat32(offset + 8, v.b, true)
			return this
		}

		/** Writes `{ r, g, b }` from [0, 1] range as three U8s (3 bytes). */
		writeColor3U8(v) {
			const offset = this._reserveGrow(3)
			this.data[offset] = Math.round(v.r * 255)
			this.data[offset + 1] = Math.round(v.g * 255)
			this.data[offset + 2] = Math.round(v.b * 255)
			return this
		}

		/** Writes `{ r, g, b, a }` as four F32s in [0, 1] range (16 bytes). */
		writeColor4F32(v) {
			const offset = this._reserveGrow(16)
			this.view.setFloat32(offset, v.r, true)
			this.view.setFloat32(offset + 4, v.g, true)
			this.view.setFloat32(offset + 8, v.b, true)
			this.view.setFloat32(offset + 12, v.a, true)
			return this
		}

		/** Writes `{ r, g, b, a }` from [0, 1] range as four U8s (4 bytes). */
		writeColor4U8(v) {
			const offset = this._reserveGrow(4)
			this.data[offset] = Math.round(v.r * 255)
			this.data[offset + 1] = Math.round(v.g * 255)
			this.data[offset + 2] = Math.round(v.b * 255)
			this.data[offset + 3] = Math.round(v.a * 255)
			return this
		}

		/**
		 * Writes a CFrame as six F32s (24 bytes): position `{x,y,z}` then rotation `{x,y,z}`.
		 * @param {{ position: {x,y,z}, rotation: {x,y,z} }} value
		 */
		writeCFrame(value) {
			const offset = this._reserveGrow(24)
			this.view.setFloat32(offset, value.position.x, true)
			this.view.setFloat32(offset + 4, value.position.y, true)
			this.view.setFloat32(offset + 8, value.position.z, true)
			this.view.setFloat32(offset + 12, value.rotation.x, true)
			this.view.setFloat32(offset + 16, value.rotation.y, true)
			this.view.setFloat32(offset + 20, value.rotation.z, true)
			return this
		}

		/**
		 * Writes `source` repeated `count` times as UTF-8 bytes.
		 * @param {string} source
		 * @param {number} count
		 */
		writeByteRepeated(source, count) {
			const encoded = __encoder.encode(source.repeat(count))
			const offset = this._reserveGrow(encoded.length)
			this.data.set(encoded, offset)
			return this
		}

		/** Returns the written bytes decoded as a UTF-8 string. */
		toString() {
			return __decoder_utf.decode(this.data.subarray(0, this.size))
		}
	}
	const ValueType = {
		NULL: 0, BOOLEAN: 1, NUMBER: 2, STRING: 3,
		ARRAY: 4, OBJECT: 5,
		UINT8: 6, INT8: 7, UINT16: 8, INT16: 9, UINT32: 10, INT32: 11,
		FLOAT32: 12, FLOAT64: 13,
	}

	/**
	 * Reads self-describing typed values written by {@link BinaryWriterTyped}.
	 * Each value is prefixed with a {@link ValueType} byte that determines how
	 * the rest of the value is read. Arrays and objects are read recursively.
	 */
	class BinaryReaderTyped {
		/** @param {BinaryReader} reader */
		constructor(reader) {
			this.reader = reader
		}

		/** Reads and returns the next typed value from the stream. */
		readValue() {
			const typeId = this.reader.readU8()
			switch (typeId) {
				case ValueType.NULL: return null
				case ValueType.BOOLEAN: return this.reader.readBool()
				case ValueType.NUMBER: return this.reader.readF64()
				case ValueType.STRING: return this.reader.readString()
				case ValueType.UINT8: return this.reader.readU8()
				case ValueType.INT8: return this.reader.readI8()
				case ValueType.UINT16: return this.reader.readU16()
				case ValueType.INT16: return this.reader.readI16()
				case ValueType.UINT32: return this.reader.readU32()
				case ValueType.INT32: return this.reader.readI32()
				case ValueType.FLOAT32: return this.reader.readF32()
				case ValueType.FLOAT64: return this.reader.readF64()
				case ValueType.ARRAY: {
					const length = this.reader.readU32()
					const array = []
					for (let i = 0; i < length; i++)
						array.push(this.readValue())
					return array
				}
				case ValueType.OBJECT: {
					const count = this.reader.readU32()
					const object = {}
					for (let i = 0; i < count; i++) {
						const key = this.readValue()
						const val = this.readValue()
						object[key] = val
					}
					return object
				}
			}
			throw new Error(`Unknown value type: ${typeId}`)
		}
	}

	/**
	 * Writes self-describing typed values readable by {@link BinaryReaderTyped}.
	 * Automatically selects the most compact numeric type for integers.
	 * Floats use F32 if the value round-trips exactly, otherwise F64.
	 */
	class BinaryWriterTyped {
		/** @param {BinaryWriter} writer */
		constructor(writer) {
			this.writer = writer
		}

		/**
		 * Writes `value` to the stream with a type prefix byte.
		 * Supports: `null`, boolean, number, string, Array, plain object.
		 * Throws for unsupported types (functions, symbols, etc.).
		 * @param {*} value
		 * @returns {this}
		 */
		writeValue(value) {
			if (value === null) {
				this.writer.writeU8(ValueType.NULL)

			} else if (typeof value === 'boolean') {
				this.writer.writeU8(ValueType.BOOLEAN)
				this.writer.writeBool(value)

			} else if (typeof value === 'number') {
				if (Number.isInteger(value)) {
					if (value >= 0 && value <= 255) {
						this.writer.writeU8(ValueType.UINT8)
						this.writer.writeU8(value)
					}
					else if (value >= -128 && value <= 127) {
						this.writer.writeU8(ValueType.INT8)
						this.writer.writeI8(value)
					}
					else if (value >= 0 && value <= 65535) {
						this.writer.writeU8(ValueType.UINT16)
						this.writer.writeU16(value)
					}
					else if (value >= -32768 && value <= 32767) {
						this.writer.writeU8(ValueType.INT16)
						this.writer.writeI16(value)
					}
					else if (value >= 0 && value <= 4294967295) {
						this.writer.writeU8(ValueType.UINT32)
						this.writer.writeU32(value)
					}
					else if (value >= -2147483648 && value <= 2147483647){
						this.writer.writeU8(ValueType.INT32)
						this.writer.writeI32(value)
					}
					else {
						this.writer.writeU8(ValueType.FLOAT64)
						this.writer.writeF64(value)
					}
				} else {
					const f32 = new Float32Array([value])[0]
					if (Math.abs(value) < 3.4e38 && !Number.isNaN(value) && f32 === value) {
						this.writer.writeU8(ValueType.FLOAT32)
						this.writer.writeF32(value)
					} else {
						this.writer.writeU8(ValueType.FLOAT64)
						this.writer.writeF64(value)
					}
				}

			}
			else if (typeof value === 'string') {
				this.writer.writeU8(ValueType.STRING)
				this.writer.writeString(value)

			}
			else if (Array.isArray(value)) {
				this.writer.writeU8(ValueType.ARRAY)
				this.writer.writeU32(value.length)
				for (const item of value)
					this.writeValue(item)
			}
			else if (typeof value === 'object') {
				this.writer.writeU8(ValueType.OBJECT)
				const entries = Object.entries(value)
				this.writer.writeU32(entries.length)
				for (const [key, val] of entries) {
					this.writeValue(key)
					this.writeValue(val)
				}
			}
			else {
				throw new Error(`Cannot serialize value of type: ${typeof value}`)
			}

			return this
		}
	}
	const DebugOpcode = {
		readU8: 0x01, readU16: 0x02, readU32: 0x03,
		readI8: 0x04, readI16: 0x05, readI32: 0x06,
		readF32: 0x07, readF64: 0x08,
		readBool: 0x09,
		readStringU8: 0x0A, readStringU16: 0x0B, readStringU32: 0x0C,
		readString: 0x0D, readCString: 0x0E,
		readVarInt: 0x0F,
		readVector2F32: 0x10, readVector2I16: 0x11, readVector2I32: 0x12,
		readVector3F32: 0x13, readVector3I16: 0x14, readVector3I32: 0x15,
		readVector4F32: 0x16, readVector4I16: 0x17, readVector4I32: 0x18,
		readColor3F32: 0x19, readColor3U8: 0x1A,
		readColor4F32: 0x1B, readColor4U8: 0x1C,
		readCFrame: 0x1D,
	}
	const DebugOpcodeToName = Object.fromEntries(
		Object.entries(DebugOpcode).map(([name, op]) => [op, name])
	)

	/**
	 * A drop-in replacement for {@link BinaryWriter} that prepends a {@link DebugOpcode}
	 * tag byte before every write. Use it paired with {@link DebugBinaryReader} to catch
	 * read/write mismatches at the exact call site rather than seeing corrupted data later.
	 *
	 * Because this class extends {@link BinaryWriter} rather than wrapping it, all methods
	 * are always present — there is no risk of passing the wrong type to the constructor.
	 *
	 * `_tag` calls `super.writeU8()` directly to write the opcode byte without triggering
	 * the overridden `writeU8`, so opcode bytes themselves are never double-tagged.
	 *
	 * @example
	 * const w = new DebugBinaryWriter()
	 * w.writeVector3F32({ x: 1, y: 2, z: 3 }) // writes: [0x13] [F32 F32 F32]
	 *
	 * const r = new DebugBinaryReader()
	 * r.setBuffer(w.data.subarray(0, w.size))
	 * r.readVector3F32() // asserts opcode 0x13, then reads the 3 floats
	 */
	class DebugBinaryWriter extends BinaryWriter {
		constructor() {
			super()
			/** @type {string[]} ordered list of opcode names written so far */
			this.log = []
		}

		/**
		 * Writes the opcode for `opcodeName` directly, bypassing the overridden `writeU8`.
		 * @param {string} opcodeName key in {@link DebugOpcode}
		 */
		_tag(opcodeName) {
			this.log.push(opcodeName)
			super.writeU8(DebugOpcode[opcodeName])
		}

		// writeZeros / padToAlignment / writeByteRepeated / writeStringOfSize
		// are intentionally not tagged — they are layout utilities, not typed values.

		writeU8(v) { this._tag('readU8'); return super.writeU8(v) }
		writeU16(v) { this._tag('readU16'); return super.writeU16(v) }
		writeU32(v) { this._tag('readU32'); return super.writeU32(v) }
		writeI8(v) { this._tag('readI8'); return super.writeI8(v) }
		writeI16(v) { this._tag('readI16'); return super.writeI16(v) }
		writeI32(v) { this._tag('readI32'); return super.writeI32(v) }
		writeF32(v) { this._tag('readF32'); return super.writeF32(v) }
		writeF64(v) { this._tag('readF64'); return super.writeF64(v) }
		writeBool(v) { this._tag('readBool'); return super.writeBool(v) }
		writeVarInt(v){ this._tag('readVarInt'); return super.writeVarInt(v) }

		writeStringU8(s) { this._tag('readStringU8'); return super.writeStringU8(s) }
		writeStringU16(s) { this._tag('readStringU16'); return super.writeStringU16(s) }
		writeStringU32(s) { this._tag('readStringU32'); return super.writeStringU32(s) }
		writeString(s) { this._tag('readString'); return super.writeString(s) }
		writeCString(s) { this._tag('readCString'); return super.writeCString(s) }

		writeVector2F32(v) { this._tag('readVector2F32'); return super.writeVector2F32(v) }
		writeVector2I16(v) { this._tag('readVector2I16'); return super.writeVector2I16(v) }
		writeVector2I32(v) { this._tag('readVector2I32'); return super.writeVector2I32(v) }
		writeVector3F32(v) { this._tag('readVector3F32'); return super.writeVector3F32(v) }
		writeVector3I16(v) { this._tag('readVector3I16'); return super.writeVector3I16(v) }
		writeVector3I32(v) { this._tag('readVector3I32'); return super.writeVector3I32(v) }
		writeVector4F32(v) { this._tag('readVector4F32'); return super.writeVector4F32(v) }
		writeVector4I16(v) { this._tag('readVector4I16'); return super.writeVector4I16(v) }
		writeVector4I32(v) { this._tag('readVector4I32'); return super.writeVector4I32(v) }

		writeColor3F32(v) { this._tag('readColor3F32'); return super.writeColor3F32(v) }
		writeColor3U8(v) { this._tag('readColor3U8'); return super.writeColor3U8(v) }
		writeColor4F32(v) { this._tag('readColor4F32'); return super.writeColor4F32(v) }
		writeColor4U8(v) { this._tag('readColor4U8'); return super.writeColor4U8(v) }

		writeCFrame(v) { this._tag('readCFrame'); return super.writeCFrame(v) }
	}

	/**
	 * A drop-in replacement for {@link BinaryReader} that asserts a {@link DebugOpcode}
	 * tag byte before every read. Throws immediately with a precise position and
	 * expected/actual opcode if the stream does not match what was written.
	 *
	 * Because this class extends {@link BinaryReader} rather than wrapping it, all
	 * methods are always present.
	 *
	 * `_assertTag` calls `super.readU8()` to consume the opcode byte without
	 * triggering the overridden `readU8`, so the opcode byte is never double-checked.
	 *
	 * @example
	 * const r = new DebugBinaryReader()
	 * r.setBuffer(debugWriterOutput)
	 * r.readVector3F32() // asserts opcode 0x13, then reads the 3 floats
	 */
	class DebugBinaryReader extends BinaryReader {
		/**
		 * @param {Uint8Array|null} data Optional buffer to read from immediately.
		 */
		constructor(data = null) {
			super(data)
			/** @type {string[]} ordered list of opcode names read so far */
			this.log = []
		}

		/**
		 * Reads the next byte via `super.readU8()` (bypassing the override) and asserts
		 * it matches the expected opcode for `opcodeName`. Throws with a diagnostic
		 * message if there is a mismatch.
		 * @param {string} opcodeName key in {@link DebugOpcode}
		 */
		_assertTag(opcodeName) {
			const expected = DebugOpcode[opcodeName]
			const actual = super.readU8() // bypass override — read raw opcode byte
			this.log.push(opcodeName)
			if (actual !== expected) {
				const actualName = DebugOpcodeToName[actual]
					?? `unknown(0x${actual.toString(16).padStart(2, '0')})`
				throw new Error(
					`Stream mismatch at position ${this.position - 1}: ` +
					`expected ${opcodeName} (0x${expected.toString(16).padStart(2, '0')}), ` +
					`got ${actualName} (0x${actual.toString(16).padStart(2, '0')})`
				)
			}
		}

		// readStringOfSize is intentionally not tagged — it is a raw utility method.

		readU8() { this._assertTag('readU8'); return super.readU8() }
		readU16() { this._assertTag('readU16'); return super.readU16() }
		readU32() { this._assertTag('readU32'); return super.readU32() }
		readI8() { this._assertTag('readI8'); return super.readI8() }
		readI16() { this._assertTag('readI16'); return super.readI16() }
		readI32() { this._assertTag('readI32'); return super.readI32() }
		readF32() { this._assertTag('readF32'); return super.readF32() }
		readF64() { this._assertTag('readF64'); return super.readF64() }
		readBool() { this._assertTag('readBool'); return super.readBool() }
		readVarInt() { this._assertTag('readVarInt'); return super.readVarInt() }

		readStringU8() { this._assertTag('readStringU8'); return super.readStringU8() }
		readStringU16() { this._assertTag('readStringU16'); return super.readStringU16() }
		readStringU32() { this._assertTag('readStringU32'); return super.readStringU32() }
		readString() { this._assertTag('readString'); return super.readString() }
		readCString() { this._assertTag('readCString'); return super.readCString() }

		readVector2F32() { this._assertTag('readVector2F32'); return super.readVector2F32() }
		readVector2I16() { this._assertTag('readVector2I16'); return super.readVector2I16() }
		readVector2I32() { this._assertTag('readVector2I32'); return super.readVector2I32() }
		readVector3F32() { this._assertTag('readVector3F32'); return super.readVector3F32() }
		readVector3I16() { this._assertTag('readVector3I16'); return super.readVector3I16() }
		readVector3I32() { this._assertTag('readVector3I32'); return super.readVector3I32() }
		readVector4F32() { this._assertTag('readVector4F32'); return super.readVector4F32() }
		readVector4I16() { this._assertTag('readVector4I16'); return super.readVector4I16() }
		readVector4I32() { this._assertTag('readVector4I32'); return super.readVector4I32() }

		readColor3F32() { this._assertTag('readColor3F32'); return super.readColor3F32() }
		readColor3U8() { this._assertTag('readColor3U8'); return super.readColor3U8() }
		readColor4F32() { this._assertTag('readColor4F32'); return super.readColor4F32() }
		readColor4U8() { this._assertTag('readColor4U8'); return super.readColor4U8() }

		readCFrame() { this._assertTag('readCFrame'); return super.readCFrame() }
	}
    return {
        BinaryContainer,
        BinaryReader,
        BinaryReaderPrimitive,
        BinaryReaderTyped,
        BinaryWriter,
        BinaryWriterPrimitive,
        BinaryWriterTyped,
        DebugBinaryReader,
        DebugBinaryWriter,
        DebugOpcode,
        DebugOpcodeToName,
        ValueType,
        clearBinaryHexData,
    }
})();