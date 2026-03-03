--!strict

-- Strips whitespace, a leading `0x` prefix, and any non-hex characters
-- from a hex string, leaving only the raw hex digit pairs.
local function clearBinaryHexData(hexString: string): string
	return hexString
		:gsub("%s+", "")
		:gsub("^0[xX]", "")
		:gsub("[^0-9a-fA-F]", "")
end

-- Shared base for all binary reader and writer classes.
-- Holds the underlying buffer, and tracks how many bytes are live (`_size`)
-- versus how many are allocated (`_capacity`).
local BinaryContainer = {} do
	BinaryContainer.__index = BinaryContainer

	function BinaryContainer.new()
		return setmetatable({
			_buffer = nil :: buffer?,
			_size = 0,
			_capacity = 0,
		}, BinaryContainer)
	end

	-- Allocates a fresh buffer of `capacity` bytes, discarding any existing data.
	function BinaryContainer:create(capacity: number)
		self._buffer = buffer.create(capacity)
		self._size = 0
		self._capacity = capacity
	end

	-- Grows the buffer to at least `newCapacity` bytes, preserving live data.
	-- Does nothing if current capacity already covers the request.
	function BinaryContainer:reserve(newCapacity: number)
		if newCapacity > self._capacity then
			local newBuf = buffer.create(newCapacity)
			if self._buffer and self._size > 0 then
				buffer.copy(newBuf, 0, self._buffer, 0, self._size)
			end
			self._buffer = newBuf
			self._capacity = newCapacity
		end
	end

	-- Reallocates to exactly `newCapacity` bytes without geometric growth.
	-- Live data up to `_size` is preserved if `newCapacity` is smaller than
	-- `_size`, the live data is truncated to fit.
	function BinaryContainer:reallocate(newCapacity: number)
		local newBuf = buffer.create(newCapacity)
		local copyLen = math.min(self._size, newCapacity)
		if self._buffer and copyLen > 0 then
			buffer.copy(newBuf, 0, self._buffer, 0, copyLen)
		end
		self._buffer = newBuf
		self._size = copyLen
		self._capacity = newCapacity
	end

	-- Returns the live bytes as a space-separated lowercase hex string, e.g. `"01 ff a0 "`.
	function BinaryContainer:toHex(): string
		local parts = table.create(self._size)
		for i = 0, self._size - 1 do
			parts[i + 1] = string.format("%02x ", buffer.readu8(self._buffer :: buffer, i))
		end
		return table.concat(parts)
	end

	-- Loads the buffer from a hex string. Whitespace and a leading `0x` are ignored.
	-- Replaces any existing contents.
	function BinaryContainer:assignHex(hexStr: string)
		local clean = clearBinaryHexData(hexStr)
		assert(#clean % 2 == 0, "Hex string has odd length")
		local count = #clean / 2
		local buf = buffer.create(count)
		for i = 0, count - 1 do
			local byte = tonumber(clean:sub(i * 2 + 1, i * 2 + 2), 16) :: number
			buffer.writeu8(buf, i, byte)
		end
		self._buffer = buf
		self._size = count
		self._capacity = count
		return self
	end

	-- Returns the live bytes as a raw Lua string (ASCII / Latin-1).
	-- Characters outside 0–127 are returned as their raw byte values.
	function BinaryContainer:toAscii(): string
		if self._size == 0 then return "" end
		return buffer.readstring(self._buffer :: buffer, 0, self._size)
	end

	-- Loads the buffer from a Lua string, one byte per character.
	-- Characters above U+00FF are truncated to their low byte.
	-- Replaces any existing contents.
	function BinaryContainer:assignAscii(str: string)
		local len = #str
		local buf = buffer.create(len)
		if len > 0 then
			buffer.writestring(buf, 0, str, len)
		end
		self._buffer = buf
		self._size = len
		self._capacity = len
		return self
	end
end


-- Reads primitive types from a fixed byte buffer.
-- All multi-byte values are read as little-endian.
--
-- Not intended for direct use in most cases — prefer `BinaryReader`,
-- which adds structured types (vectors, colors, strings, etc.).
local BinaryReaderPrimitive = setmetatable({}, BinaryContainer) do
	BinaryReaderPrimitive.__index = BinaryReaderPrimitive

	-- @param buf buffer? Optional buffer to read from immediately.
	function BinaryReaderPrimitive.new(buf: buffer?)
		local self = setmetatable(BinaryContainer.new(), BinaryReaderPrimitive)
		self._position = 0
		if buf then
			self._buffer = buf
			self._size = buffer.len(buf)
			self._capacity = self._size
		end
		return self
	end

	-- Advances the read position by `bytes` without reading anything.
	-- Throws if skipping would go past the end of the buffer.
	function BinaryReaderPrimitive:skip(bytes: number)
		self._position += bytes
		if self._position > self._size then
			error("Cannot skip past end of buffer", 2)
		end
		return self
	end

	-- Advances the read position forward to the next multiple of `alignment`.
	-- Does nothing if the position is already aligned.
	function BinaryReaderPrimitive:align(alignment: number)
		local offset = self._position % alignment
		if offset ~= 0 then
			self._position += alignment - offset
		end
		return self
	end

	-- Returns the current read position.
	function BinaryReaderPrimitive:tell(): number
		return self._position
	end

	-- Moves the read position to `pos`.
	-- Throws if `pos` is negative or beyond the buffer size.
	function BinaryReaderPrimitive:seek(pos: number)
		if pos < 0 or pos > self._size then
			error(`Invalid seek position: {pos}`, 2)
		end
		self._position = pos
		return self
	end

	-- Replaces the buffer and resets the read position to 0.
	function BinaryReaderPrimitive:setBuffer(buf: buffer)
		self._buffer = buf
		self._size = buffer.len(buf)
		self._capacity = self._size
		self._position = 0
	end

	-- Reads 1 byte as an unsigned 8-bit integer.
	function BinaryReaderPrimitive:readU8(): number
		local value = buffer.readu8(self._buffer :: buffer, self._position)
		self._position += 1
		return value
	end

	-- Reads 2 bytes as an unsigned 16-bit little-endian integer.
	function BinaryReaderPrimitive:readU16(): number
		local value = buffer.readu16(self._buffer :: buffer, self._position)
		self._position += 2
		return value
	end

	-- Reads 4 bytes as an unsigned 32-bit little-endian integer.
	function BinaryReaderPrimitive:readU32(): number
		local value = buffer.readu32(self._buffer :: buffer, self._position)
		self._position += 4
		return value
	end

	-- Reads 1 byte as a signed 8-bit integer.
	function BinaryReaderPrimitive:readI8(): number
		local value = buffer.readi8(self._buffer :: buffer, self._position)
		self._position += 1
		return value
	end

	-- Reads 2 bytes as a signed 16-bit little-endian integer.
	function BinaryReaderPrimitive:readI16(): number
		local value = buffer.readi16(self._buffer :: buffer, self._position)
		self._position += 2
		return value
	end

	-- Reads 4 bytes as a signed 32-bit little-endian integer.
	function BinaryReaderPrimitive:readI32(): number
		local value = buffer.readi32(self._buffer :: buffer, self._position)
		self._position += 4
		return value
	end

	-- Reads 4 bytes as a 32-bit little-endian float.
	function BinaryReaderPrimitive:readF32(): number
		local value = buffer.readf32(self._buffer :: buffer, self._position)
		self._position += 4
		return value
	end

	-- Reads 8 bytes as a 64-bit little-endian float.
	function BinaryReaderPrimitive:readF64(): number
		local value = buffer.readf64(self._buffer :: buffer, self._position)
		self._position += 8
		return value
	end

	-- Reads 1 byte and returns `true` if it is non-zero.
	function BinaryReaderPrimitive:readBool(): boolean
		local value = buffer.readu8(self._buffer :: buffer, self._position)
		self._position += 1
		return value ~= 0
	end

	-- Reads a variable-length unsigned integer encoded in LEB128 format.
	-- Consumes 1–5 bytes depending on the value.
	function BinaryReaderPrimitive:readVarInt(): number
		local buf = self._buffer :: buffer
		local value = 0
		local shift = 0
		while true do
			local byte = buffer.readu8(buf, self._position)
			self._position += 1
			value += (byte & 127) << shift
			if (byte & 128) == 0 then break end
			shift += 7
		end
		return value
	end

	-- Reads exactly `size` bytes and returns them as a Lua string.
	-- Does not read a length prefix — use one of the `readStringXxx` methods for that.
	function BinaryReaderPrimitive:readStringOfSize(size: number): string
		local value = buffer.readstring(self._buffer :: buffer, self._position, size)
		self._position += size
		return value
	end

end

-- Extends `BinaryReaderPrimitive` with structured types:
-- length-prefixed strings, null-terminated strings, 2D/3D/4D vectors,
-- colors, and CFrames.
--
-- All structured methods read directly from the buffer — they do not call
-- the primitive `readXxx` methods. This is intentional: `DebugBinaryReader`
-- overrides the primitives to enforce opcode tags, and structured reads
-- must not trigger those assertions on their internal component reads.
local BinaryReader = setmetatable({}, BinaryReaderPrimitive) do
	BinaryReader.__index = BinaryReader

	-- @param buf buffer? Optional buffer to read from immediately.
	function BinaryReader.new(buf: buffer?)
		return setmetatable(BinaryReaderPrimitive.new(buf), BinaryReader)
	end

	-- Reads a U8-prefixed byte length, then that many bytes as a string.
	function BinaryReader:readStringU8(): string
		local buf = self._buffer :: buffer
		local size = buffer.readu8(buf, self._position)
		self._position += 1
		local value = buffer.readstring(buf, self._position, size)
		self._position += size
		return value
	end

	-- Reads a U16-prefixed byte length, then that many bytes as a string.
	function BinaryReader:readStringU16(): string
		local buf = self._buffer :: buffer
		local size = buffer.readu16(buf, self._position)
		self._position += 2
		local value = buffer.readstring(buf, self._position, size)
		self._position += size
		return value
	end

	-- Reads a U32-prefixed byte length, then that many bytes as a string.
	function BinaryReader:readStringU32(): string
		local buf = self._buffer :: buffer
		local size = buffer.readu32(buf, self._position)
		self._position += 4
		local value = buffer.readstring(buf, self._position, size)
		self._position += size
		return value
	end

	-- Reads a length-prefixed string using the default U32 prefix.
	-- Mirrors `BinaryWriter:writeString`.
	function BinaryReader:readString(): string
		return self:readStringU32()
	end

	-- Reads bytes until a null terminator (`0x00`) and returns them as a string.
	-- The null byte is consumed but not included in the result.
	-- Throws if the buffer ends before a null byte is found.
	function BinaryReader:readCString(): string
		local buf = self._buffer :: buffer
		local start = self._position
		local cursor = start
		while cursor < self._size and buffer.readu8(buf, cursor) ~= 0 do
			cursor += 1
		end
		if cursor == self._size then
			error("string is not null-terminated", 2)
		end
		local value = buffer.readstring(buf, start, cursor - start)
		self._position = cursor + 1
		return value
	end

	-- Reads two F32s as `{ x: number, y: number }`.
	function BinaryReader:readVector2F32(): { x: number, y: number }
		local buf = self._buffer :: buffer
		local x = buffer.readf32(buf, self._position)
		local y = buffer.readf32(buf, self._position + 4)
		self._position += 8
		return { x = x, y = y }
	end

	-- Reads two I16s as `{ x: number, y: number }`.
	function BinaryReader:readVector2I16(): { x: number, y: number }
		local buf = self._buffer :: buffer
		local x = buffer.readi16(buf, self._position)
		local y = buffer.readi16(buf, self._position + 2)
		self._position += 4
		return { x = x, y = y }
	end

	-- Reads two I32s as `{ x: number, y: number }`.
	function BinaryReader:readVector2I32(): { x: number, y: number }
		local buf = self._buffer :: buffer
		local x = buffer.readi32(buf, self._position)
		local y = buffer.readi32(buf, self._position + 4)
		self._position += 8
		return { x = x, y = y }
	end

	-- Reads three F32s as `{ x: number, y: number, z: number }`.
	function BinaryReader:readVector3F32(): { x: number, y: number, z: number }
		local buf = self._buffer :: buffer
		local x = buffer.readf32(buf, self._position)
		local y = buffer.readf32(buf, self._position + 4)
		local z = buffer.readf32(buf, self._position + 8)
		self._position += 12
		return { x = x, y = y, z = z }
	end

	-- Reads three I16s as `{ x: number, y: number, z: number }`.
	function BinaryReader:readVector3I16(): { x: number, y: number, z: number }
		local buf = self._buffer :: buffer
		local x = buffer.readi16(buf, self._position)
		local y = buffer.readi16(buf, self._position + 2)
		local z = buffer.readi16(buf, self._position + 4)
		self._position += 6
		return { x = x, y = y, z = z }
	end

	-- Reads three I32s as `{ x: number, y: number, z: number }`.
	function BinaryReader:readVector3I32(): { x: number, y: number, z: number }
		local buf = self._buffer :: buffer
		local x = buffer.readi32(buf, self._position)
		local y = buffer.readi32(buf, self._position + 4)
		local z = buffer.readi32(buf, self._position + 8)
		self._position += 12
		return { x = x, y = y, z = z }
	end

	-- Reads four F32s as `{ x: number, y: number, z: number, w: number }`.
	function BinaryReader:readVector4F32(): { x: number, y: number, z: number, w: number }
		local buf = self._buffer :: buffer
		local x = buffer.readf32(buf, self._position)
		local y = buffer.readf32(buf, self._position + 4)
		local z = buffer.readf32(buf, self._position + 8)
		local w = buffer.readf32(buf, self._position + 12)
		self._position += 16
		return { x = x, y = y, z = z, w = w }
	end

	-- Reads four I16s as `{ x: number, y: number, z: number, w: number }`.
	function BinaryReader:readVector4I16(): { x: number, y: number, z: number, w: number }
		local buf = self._buffer :: buffer
		local x = buffer.readi16(buf, self._position)
		local y = buffer.readi16(buf, self._position + 2)
		local z = buffer.readi16(buf, self._position + 4)
		local w = buffer.readi16(buf, self._position + 6)
		self._position += 8
		return { x = x, y = y, z = z, w = w }
	end

	-- Reads four I32s as `{ x: number, y: number, z: number, w: number }`.
	function BinaryReader:readVector4I32(): { x: number, y: number, z: number, w: number }
		local buf = self._buffer :: buffer
		local x = buffer.readi32(buf, self._position)
		local y = buffer.readi32(buf, self._position + 4)
		local z = buffer.readi32(buf, self._position + 8)
		local w = buffer.readi32(buf, self._position + 12)
		self._position += 16
		return { x = x, y = y, z = z, w = w }
	end

	-- Reads three F32s as `{ r, g, b }` in [0, 1] range.
	function BinaryReader:readColor3F32(): { r: number, g: number, b: number }
		local buf = self._buffer :: buffer
		local r = buffer.readf32(buf, self._position)
		local g = buffer.readf32(buf, self._position + 4)
		local b = buffer.readf32(buf, self._position + 8)
		self._position += 12
		return { r = r, g = g, b = b }
	end

	-- Reads three U8s as `{ r, g, b }` normalized to [0, 1].
	function BinaryReader:readColor3U8(): { r: number, g: number, b: number }
		local buf = self._buffer :: buffer
		local r = buffer.readu8(buf, self._position) / 255
		local g = buffer.readu8(buf, self._position + 1) / 255
		local b = buffer.readu8(buf, self._position + 2) / 255
		self._position += 3
		return { r = r, g = g, b = b }
	end

	-- Reads four F32s as `{ r, g, b, a }` in [0, 1] range.
	function BinaryReader:readColor4F32(): { r: number, g: number, b: number, a: number }
		local buf = self._buffer :: buffer
		local r = buffer.readf32(buf, self._position)
		local g = buffer.readf32(buf, self._position + 4)
		local b = buffer.readf32(buf, self._position + 8)
		local a = buffer.readf32(buf, self._position + 12)
		self._position += 16
		return { r = r, g = g, b = b, a = a }
	end

	-- Reads four U8s as `{ r, g, b, a }` normalized to [0, 1].
	function BinaryReader:readColor4U8(): { r: number, g: number, b: number, a: number }
		local buf = self._buffer :: buffer
		local r = buffer.readu8(buf, self._position) / 255
		local g = buffer.readu8(buf, self._position + 1) / 255
		local b = buffer.readu8(buf, self._position + 2) / 255
		local a = buffer.readu8(buf, self._position + 3) / 255
		self._position += 4
		return { r = r, g = g, b = b, a = a }
	end

	-- Reads six F32s as a CFrame: `{ position: {x,y,z}, rotation: {x,y,z} }`.
	-- Position is read first, then Euler rotation angles.
	function BinaryReader:readCFrame()
		local buf = self._buffer :: buffer
		local px = buffer.readf32(buf, self._position)
		local py = buffer.readf32(buf, self._position + 4)
		local pz = buffer.readf32(buf, self._position + 8)
		local rx = buffer.readf32(buf, self._position + 12)
		local ry = buffer.readf32(buf, self._position + 16)
		local rz = buffer.readf32(buf, self._position + 20)
		self._position += 24
		return {
			position = { x = px, y = py, z = pz },
			rotation = { x = rx, y = ry, z = rz },
		}
	end

end

-- Writes primitive types to a dynamically-growing byte buffer.
-- All multi-byte values are written as little-endian.
-- The buffer grows geometrically (doubles) to amortise allocations.
--
-- Not intended for direct use in most cases — prefer `BinaryWriter`,
-- which adds structured types (vectors, colors, strings, etc.).
local BinaryWriterPrimitive = setmetatable({}, BinaryContainer) do
	BinaryWriterPrimitive.__index = BinaryWriterPrimitive

	function BinaryWriterPrimitive.new()
		return setmetatable(BinaryContainer.new(), BinaryWriterPrimitive)
	end

	-- Ensures the buffer has room for `size` more bytes, growing geometrically if needed.
	-- Returns the byte offset at which to write the new data.
	-- @param size number number of bytes needed
	-- @return number offset of the newly reserved region
	function BinaryWriterPrimitive:_reserveGrow(size: number): number
		local currentSize = self._size
		local newSize = currentSize + size

		if newSize > self._capacity then
			local newCapacity = math.max(newSize, self._capacity * 2)
			local newBuf = buffer.create(newCapacity)
			if self._buffer and currentSize > 0 then
				buffer.copy(newBuf, 0, self._buffer, 0, currentSize)
			end
			self._buffer = newBuf
			self._capacity = newCapacity -- track actual allocation, not just newSize
		end

		self._size = newSize
		return currentSize
	end

	-- Writes `value` as an unsigned 8-bit integer (1 byte).
	function BinaryWriterPrimitive:writeU8(value: number)
		local offset = self:_reserveGrow(1)
		buffer.writeu8(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as an unsigned 16-bit little-endian integer (2 bytes).
	function BinaryWriterPrimitive:writeU16(value: number)
		local offset = self:_reserveGrow(2)
		buffer.writeu16(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as an unsigned 32-bit little-endian integer (4 bytes).
	function BinaryWriterPrimitive:writeU32(value: number)
		local offset = self:_reserveGrow(4)
		buffer.writeu32(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as a signed 8-bit integer (1 byte).
	function BinaryWriterPrimitive:writeI8(value: number)
		local offset = self:_reserveGrow(1)
		buffer.writei8(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as a signed 16-bit little-endian integer (2 bytes).
	function BinaryWriterPrimitive:writeI16(value: number)
		local offset = self:_reserveGrow(2)
		buffer.writei16(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as a signed 32-bit little-endian integer (4 bytes).
	function BinaryWriterPrimitive:writeI32(value: number)
		local offset = self:_reserveGrow(4)
		buffer.writei32(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as a 32-bit little-endian float (4 bytes).
	function BinaryWriterPrimitive:writeF32(value: number)
		local offset = self:_reserveGrow(4)
		buffer.writef32(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `value` as a 64-bit little-endian float (8 bytes).
	function BinaryWriterPrimitive:writeF64(value: number)
		local offset = self:_reserveGrow(8)
		buffer.writef64(self._buffer :: buffer, offset, value)
		return self
	end

	-- Writes `true` as `0x01` and `false` as `0x00` (1 byte).
	function BinaryWriterPrimitive:writeBool(value: boolean)
		local offset = self:_reserveGrow(1)
		buffer.writeu8(self._buffer :: buffer, offset, if value then 1 else 0)
		return self
	end

	-- Writes `value` as a variable-length unsigned integer in LEB128 format.
	-- Uses 1–5 bytes depending on the magnitude of `value`.
	-- @param value number non-negative integer
	function BinaryWriterPrimitive:writeVarInt(value: number)
		-- Pre-compute byte count so we can _reserveGrow once
		local temp = value
		local size = 0
		repeat
			size += 1
			temp >>= 7
		until temp == 0

		local offset = self:_reserveGrow(size)
		local buf = self._buffer :: buffer
		local pos = 0
		temp = value
		while temp >= 128 do
			buffer.writeu8(buf, offset + pos, (temp & 127) | 128)
			pos += 1
			temp >>= 7
		end
		buffer.writeu8(buf, offset + pos, temp)
		return self
	end

	-- Appends `count` zero bytes using a single buffer reservation.
	function BinaryWriterPrimitive:writeZeros(count: number)
		local offset = self:_reserveGrow(count)
		-- buffer.create already zero-initialises, but after a grow the region is fresh
		-- zeros. After a reuse we fill explicitly to be safe.
		local buf = self._buffer :: buffer
		for i = 0, count - 1 do
			buffer.writeu8(buf, offset + i, 0)
		end
		return self
	end

	-- Pads the buffer with `fill` bytes up to the next multiple of `alignment`.
	-- Does nothing if already aligned.
	-- @param alignment number defaults to 4
	-- @param fill number byte value to pad with, defaults to 0
	function BinaryWriterPrimitive:padToAlignment(alignment: number?, fill: number?)
		local align = alignment or 4
		local fillBy = fill or 0
		local rem = self._size % align
		if rem ~= 0 then
			local count = align - rem
			local offset = self:_reserveGrow(count)
			local buf = self._buffer :: buffer
			for i = 0, count - 1 do
				buffer.writeu8(buf, offset + i, fillBy)
			end
		end
		return self
	end

end

-- Extends `BinaryWriterPrimitive` with structured types:
-- length-prefixed strings, null-terminated strings, 2D/3D/4D vectors,
-- colors, and CFrames.
--
-- All structured methods call `_reserveGrow` once for the entire structure
-- and write directly into the buffer — they do not call the primitive
-- `writeXxx` methods. This is intentional: `DebugBinaryWriter` overrides
-- the primitives to prepend opcode tags, and structured writes must not
-- emit those tags for their internal component writes.
local BinaryWriter = setmetatable({}, BinaryWriterPrimitive) do
	BinaryWriter.__index = BinaryWriter

	function BinaryWriter.new()
		return setmetatable(BinaryWriterPrimitive.new(), BinaryWriter)
	end

	-- Writes a string prefixed with its byte length as a U8.
	-- Maximum string size: 255 bytes.
	function BinaryWriter:writeStringU8(source: string)
		local len = #source
		local offset = self:_reserveGrow(1 + len)
		local buf = self._buffer :: buffer
		buffer.writeu8(buf, offset, len)
		if len > 0 then buffer.writestring(buf, offset + 1, source, len) end
		return self
	end

	-- Writes a string prefixed with its byte length as a U16.
	-- Maximum string size: 65535 bytes.
	function BinaryWriter:writeStringU16(source: string)
		local len = #source
		local offset = self:_reserveGrow(2 + len)
		local buf = self._buffer :: buffer
		buffer.writeu16(buf, offset, len)
		if len > 0 then buffer.writestring(buf, offset + 2, source, len) end
		return self
	end

	-- Writes a string prefixed with its byte length as a U32.
	function BinaryWriter:writeStringU32(source: string)
		local len = #source
		local offset = self:_reserveGrow(4 + len)
		local buf = self._buffer :: buffer
		buffer.writeu32(buf, offset, len)
		if len > 0 then buffer.writestring(buf, offset + 4, source, len) end
		return self
	end

	-- Writes a length-prefixed string using the default U32 prefix.
	-- Mirrors `BinaryReader:readString`.
	function BinaryWriter:writeString(source: string)
		return self:writeStringU32(source)
	end

	-- Writes a string followed by a null terminator byte (`0x00`).
	-- Mirrors `BinaryReader:readCString`.
	function BinaryWriter:writeCString(source: string)
		local len = #source
		local offset = self:_reserveGrow(len + 1)
		local buf = self._buffer :: buffer
		if len > 0 then buffer.writestring(buf, offset, source, len) end
		buffer.writeu8(buf, offset + len, 0)
		return self
	end

	-- Writes exactly `stringSize` bytes from `source`.
	-- If `source` is shorter than `stringSize` the remaining bytes are left as zero.
	-- If longer it is truncated to `stringSize` bytes.
	function BinaryWriter:writeStringOfSize(source: string, stringSize: number)
		local offset = self:_reserveGrow(stringSize)
		local len = math.min(#source, stringSize)
		if len > 0 then
			buffer.writestring(self._buffer :: buffer, offset, source, len)
		end
		return self
	end

	-- Writes `source` repeated `count` times as raw bytes.
	function BinaryWriter:writeByteRepeated(source: string, count: number)
		local repeated = source:rep(count)
		local len = #repeated
		local offset = self:_reserveGrow(len)
		if len > 0 then
			buffer.writestring(self._buffer :: buffer, offset, repeated, len)
		end
		return self
	end

	-- Returns the live bytes decoded as a UTF-8 string.
	function BinaryWriter:toString(): string
		if self._size == 0 then return "" end
		return buffer.readstring(self._buffer :: buffer, 0, self._size)
	end

	-- Writes `{ x, y }` as two F32s (8 bytes).
	function BinaryWriter:writeVector2F32(v: { x: number, y: number })
		local offset = self:_reserveGrow(8)
		local buf = self._buffer :: buffer
		buffer.writef32(buf, offset, v.x)
		buffer.writef32(buf, offset + 4, v.y)
		return self
	end

	-- Writes `{ x, y }` as two I16s (4 bytes).
	function BinaryWriter:writeVector2I16(v: { x: number, y: number })
		local offset = self:_reserveGrow(4)
		local buf = self._buffer :: buffer
		buffer.writei16(buf, offset, v.x)
		buffer.writei16(buf, offset + 2, v.y)
		return self
	end

	-- Writes `{ x, y }` as two I32s (8 bytes).
	function BinaryWriter:writeVector2I32(v: { x: number, y: number })
		local offset = self:_reserveGrow(8)
		local buf = self._buffer :: buffer
		buffer.writei32(buf, offset, v.x)
		buffer.writei32(buf, offset + 4, v.y)
		return self
	end

	-- Writes `{ x, y, z }` as three F32s (12 bytes).
	function BinaryWriter:writeVector3F32(v: { x: number, y: number, z: number })
		local offset = self:_reserveGrow(12)
		local buf = self._buffer :: buffer
		buffer.writef32(buf, offset, v.x)
		buffer.writef32(buf, offset + 4, v.y)
		buffer.writef32(buf, offset + 8, v.z)
		return self
	end

	-- Writes `{ x, y, z }` as three I16s (6 bytes).
	function BinaryWriter:writeVector3I16(v: { x: number, y: number, z: number })
		local offset = self:_reserveGrow(6)
		local buf = self._buffer :: buffer
		buffer.writei16(buf, offset, v.x)
		buffer.writei16(buf, offset + 2, v.y)
		buffer.writei16(buf, offset + 4, v.z)
		return self
	end

	-- Writes `{ x, y, z }` as three I32s (12 bytes).
	function BinaryWriter:writeVector3I32(v: { x: number, y: number, z: number })
		local offset = self:_reserveGrow(12)
		local buf = self._buffer :: buffer
		buffer.writei32(buf, offset, v.x)
		buffer.writei32(buf, offset + 4, v.y)
		buffer.writei32(buf, offset + 8, v.z)
		return self
	end

	-- Writes `{ x, y, z, w }` as four F32s (16 bytes).
	function BinaryWriter:writeVector4F32(v: { x: number, y: number, z: number, w: number })
		local offset = self:_reserveGrow(16)
		local buf = self._buffer :: buffer
		buffer.writef32(buf, offset, v.x)
		buffer.writef32(buf, offset + 4, v.y)
		buffer.writef32(buf, offset + 8, v.z)
		buffer.writef32(buf, offset + 12, v.w)
		return self
	end

	-- Writes `{ x, y, z, w }` as four I16s (8 bytes).
	function BinaryWriter:writeVector4I16(v: { x: number, y: number, z: number, w: number })
		local offset = self:_reserveGrow(8)
		local buf = self._buffer :: buffer
		buffer.writei16(buf, offset, v.x)
		buffer.writei16(buf, offset + 2, v.y)
		buffer.writei16(buf, offset + 4, v.z)
		buffer.writei16(buf, offset + 6, v.w)
		return self
	end

	-- Writes `{ x, y, z, w }` as four I32s (16 bytes).
	function BinaryWriter:writeVector4I32(v: { x: number, y: number, z: number, w: number })
		local offset = self:_reserveGrow(16)
		local buf = self._buffer :: buffer
		buffer.writei32(buf, offset, v.x)
		buffer.writei32(buf, offset + 4, v.y)
		buffer.writei32(buf, offset + 8, v.z)
		buffer.writei32(buf, offset + 12, v.w)
		return self
	end

	-- Writes `{ r, g, b }` as three F32s in [0, 1] range (12 bytes).
	function BinaryWriter:writeColor3F32(v: { r: number, g: number, b: number })
		local offset = self:_reserveGrow(12)
		local buf = self._buffer :: buffer
		buffer.writef32(buf, offset, v.r)
		buffer.writef32(buf, offset + 4, v.g)
		buffer.writef32(buf, offset + 8, v.b)
		return self
	end

	-- Writes `{ r, g, b }` from [0, 1] range as three U8s (3 bytes).
	function BinaryWriter:writeColor3U8(v: { r: number, g: number, b: number })
		local offset = self:_reserveGrow(3)
		local buf = self._buffer :: buffer
		buffer.writeu8(buf, offset, math.round(v.r * 255))
		buffer.writeu8(buf, offset + 1, math.round(v.g * 255))
		buffer.writeu8(buf, offset + 2, math.round(v.b * 255))
		return self
	end

	-- Writes `{ r, g, b, a }` as four F32s in [0, 1] range (16 bytes).
	function BinaryWriter:writeColor4F32(v: { r: number, g: number, b: number, a: number })
		local offset = self:_reserveGrow(16)
		local buf = self._buffer :: buffer
		buffer.writef32(buf, offset, v.r)
		buffer.writef32(buf, offset + 4, v.g)
		buffer.writef32(buf, offset + 8, v.b)
		buffer.writef32(buf, offset + 12, v.a)
		return self
	end

	-- Writes `{ r, g, b, a }` from [0, 1] range as four U8s (4 bytes).
	function BinaryWriter:writeColor4U8(v: { r: number, g: number, b: number, a: number })
		local offset = self:_reserveGrow(4)
		local buf = self._buffer :: buffer
		buffer.writeu8(buf, offset, math.round(v.r * 255))
		buffer.writeu8(buf, offset + 1, math.round(v.g * 255))
		buffer.writeu8(buf, offset + 2, math.round(v.b * 255))
		buffer.writeu8(buf, offset + 3, math.round(v.a * 255))
		return self
	end

	-- Writes a CFrame as six F32s (24 bytes): position `{x,y,z}` then rotation `{x,y,z}`.
	function BinaryWriter:writeCFrame(value: { position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number } })
		local offset = self:_reserveGrow(24)
		local buf = self._buffer :: buffer
		buffer.writef32(buf, offset, value.position.x)
		buffer.writef32(buf, offset + 4, value.position.y)
		buffer.writef32(buf, offset + 8, value.position.z)
		buffer.writef32(buf, offset + 12, value.rotation.x)
		buffer.writef32(buf, offset + 16, value.rotation.y)
		buffer.writef32(buf, offset + 20, value.rotation.z)
		return self
	end

end


local ValueType = {
	NULL = 0,
	BOOLEAN = 1,
	NUMBER = 2,
	STRING = 3,
	ARRAY = 4,
	OBJECT = 5,
	UINT8 = 6,
	INT8 = 7,
	UINT16 = 8,
	INT16 = 9,
	UINT32 = 10,
	INT32 = 11,
	FLOAT32 = 12,
	FLOAT64 = 13,
}

-- Returns true if table `t` is a sequential array (all keys are integers 1..n).
local function isArray(t: { [any]: any }): boolean
	local count = 0
	for _ in next, t do count += 1 end
	return count == #t
end

-- Reads self-describing typed values written by `BinaryWriterTyped`.
-- Each value is prefixed with a `ValueType` byte that determines how the rest
-- of the value is read. Arrays and objects are read recursively.
local BinaryReaderTyped = {} do
	BinaryReaderTyped.__index = BinaryReaderTyped

	-- @param reader BinaryReader
	function BinaryReaderTyped.new(reader: typeof(BinaryReader.new()))
		return setmetatable({ reader = reader }, BinaryReaderTyped)
	end

	-- Reads and returns the next typed value from the stream.
	function BinaryReaderTyped:readValue(): any
		local typeId = self.reader:readU8()
		if typeId == ValueType.NULL then return nil
		elseif typeId == ValueType.BOOLEAN then return self.reader:readBool()
		elseif typeId == ValueType.NUMBER then return self.reader:readF64()
		elseif typeId == ValueType.STRING then return self.reader:readString()
		elseif typeId == ValueType.UINT8 then return self.reader:readU8()
		elseif typeId == ValueType.INT8 then return self.reader:readI8()
		elseif typeId == ValueType.UINT16 then return self.reader:readU16()
		elseif typeId == ValueType.INT16 then return self.reader:readI16()
		elseif typeId == ValueType.UINT32 then return self.reader:readU32()
		elseif typeId == ValueType.INT32 then return self.reader:readI32()
		elseif typeId == ValueType.FLOAT32 then return self.reader:readF32()
		elseif typeId == ValueType.FLOAT64 then return self.reader:readF64()
		elseif typeId == ValueType.ARRAY then
			local length = self.reader:readU32()
			local array = table.create(length)
			for i = 1, length do
				array[i] = self:readValue()
			end
			return array
		elseif typeId == ValueType.OBJECT then
			local count = self.reader:readU32()
			local object = {}
			for _ = 1, count do
				local key = self:readValue()
				local val = self:readValue()
				object[key] = val
			end
			return object
		end
		error(`Unknown value type: {typeId}`, 2)
	end

end

-- Writes self-describing typed values readable by `BinaryReaderTyped`.
-- Automatically selects the most compact integer type for numbers.
-- Floats use F32 if the value round-trips exactly, otherwise F64.
local BinaryWriterTyped = {} do
	BinaryWriterTyped.__index = BinaryWriterTyped

	-- @param writer BinaryWriter
	function BinaryWriterTyped.new(writer: typeof(BinaryWriter.new()))
		return setmetatable({ writer = writer }, BinaryWriterTyped)
	end

	-- Writes `value` to the stream with a type prefix byte.
	-- Supports: nil, boolean, number, string, array table, dictionary table.
	-- Throws for unsupported types (functions, userdata, etc.).
	function BinaryWriterTyped:writeValue(value: any)
		local w = self.writer

		if value == nil then
			w:writeU8(ValueType.NULL)

		elseif type(value) == "boolean" then
			w:writeU8(ValueType.BOOLEAN)
			w:writeBool(value)

		elseif type(value) == "number" then
			if math.type(value) == "integer" then
				if value >= 0 and value <= 255 then w:writeU8(ValueType.UINT8) w:writeU8(value)
				elseif value >= -128 and value <= 127 then w:writeU8(ValueType.INT8) w:writeI8(value)
				elseif value >= 0 and value <= 65535 then w:writeU8(ValueType.UINT16) w:writeU16(value)
				elseif value >= -32768 and value <= 32767 then w:writeU8(ValueType.INT16) w:writeI16(value)
				elseif value >= 0 and value <= 4294967295 then w:writeU8(ValueType.UINT32) w:writeU32(value)
				elseif value >= -2147483648 and value <= 2147483647 then w:writeU8(ValueType.INT32) w:writeI32(value)
				else w:writeU8(ValueType.FLOAT64) w:writeF64(value)
				end
			else
				-- Float: use F32 if the value round-trips exactly, otherwise F64
				local asF32 = buffer.create(4)
				buffer.writef32(asF32, 0, value)
				if buffer.readf32(asF32, 0) == value then
					w:writeU8(ValueType.FLOAT32)
					w:writeF32(value)
				else
					w:writeU8(ValueType.FLOAT64)
					w:writeF64(value)
				end
			end

		elseif type(value) == "string" then
			w:writeU8(ValueType.STRING)
			w:writeString(value)

		elseif type(value) == "table" then
			if isArray(value) then
				w:writeU8(ValueType.ARRAY)
				w:writeU32(#value)
				for _, item in ipairs(value) do
					self:writeValue(item)
				end
			else
				w:writeU8(ValueType.OBJECT)
				local entries = {}
				for k, v in pairs(value) do
					table.insert(entries, { k, v })
				end
				w:writeU32(#entries)
				for _, entry in ipairs(entries) do
					self:writeValue(entry[1])
					self:writeValue(entry[2])
				end
			end

		else
			error(`Cannot serialize value of type: {type(value)}`, 2)
		end

		return self
	end

end

local DebugOpcode = {
	readU8 = 0x01, readU16 = 0x02, readU32 = 0x03,
	readI8 = 0x04, readI16 = 0x05, readI32 = 0x06,
	readF32 = 0x07, readF64 = 0x08,
	readBool = 0x09,
	readStringU8 = 0x0A, readStringU16 = 0x0B, readStringU32 = 0x0C,
	readString = 0x0D, readCString = 0x0E,
	readVarInt = 0x0F,
	readVector2F32 = 0x10, readVector2I16 = 0x11, readVector2I32 = 0x12,
	readVector3F32 = 0x13, readVector3I16 = 0x14, readVector3I32 = 0x15,
	readVector4F32 = 0x16, readVector4I16 = 0x17, readVector4I32 = 0x18,
	readColor3F32 = 0x19, readColor3U8 = 0x1A,
	readColor4F32 = 0x1B, readColor4U8 = 0x1C,
	readCFrame = 0x1D,
}

local DebugOpcodeToName: { [number]: string } = {}
for name, op in next, DebugOpcode do
	DebugOpcodeToName[op] = name
end

-- A drop-in replacement for `BinaryWriter` that prepends a `DebugOpcode` tag byte
-- before every write. Use it paired with `DebugBinaryReader` to catch read/write
-- mismatches at the exact call site rather than seeing corrupted data later.
--
-- Because this class extends `BinaryWriter` rather than wrapping it, all methods
-- are always present — there is no risk of passing the wrong type.
--
-- `_tag` calls `BinaryWriterPrimitive.writeU8` directly to write the opcode byte
-- without triggering the overridden `writeU8`, so opcode bytes are never double-tagged.
-- Structured methods (e.g. `writeVector3F32`) call `BinaryWriter.writeVector3F32`
-- directly, so no spurious component tags appear inside a structured opcode.
--
-- @example
-- local w = DebugBinaryWriter.new()
-- w:writeVector3F32({ x = 1, y = 2, z = 3 }) -- writes: [0x13] [F32 F32 F32]
-- local r = DebugBinaryReader.new()
-- r:setBuffer(buffer.create(w._size)) -- (copy w._buffer across)
-- r:readVector3F32() -- asserts opcode 0x13, then reads the 3 floats
local DebugBinaryWriter = setmetatable({}, BinaryWriter) do
	DebugBinaryWriter.__index = DebugBinaryWriter

	function DebugBinaryWriter.new()
		local self = setmetatable(BinaryWriter.new(), DebugBinaryWriter)
		self.log = {} :: { string }
		return self
	end

	-- writeZeros / padToAlignment / writeByteRepeated / writeStringOfSize
	-- are intentionally not tagged — they are layout utilities, not typed values.

	-- Writes the opcode for `opcodeName` directly via `BinaryWriterPrimitive.writeU8`,
	-- bypassing this class's overridden `writeU8` so the tag byte is not itself tagged.
	function DebugBinaryWriter:_tag(opcodeName: string)
		table.insert(self.log, opcodeName)
		BinaryWriterPrimitive.writeU8(self, DebugOpcode[opcodeName])
	end

	function DebugBinaryWriter:writeU8(v: number) self:_tag("readU8") BinaryWriter.writeU8(self, v) return self end
	function DebugBinaryWriter:writeU16(v: number) self:_tag("readU16") BinaryWriter.writeU16(self, v) return self end
	function DebugBinaryWriter:writeU32(v: number) self:_tag("readU32") BinaryWriter.writeU32(self, v) return self end
	function DebugBinaryWriter:writeI8(v: number) self:_tag("readI8") BinaryWriter.writeI8(self, v) return self end
	function DebugBinaryWriter:writeI16(v: number) self:_tag("readI16") BinaryWriter.writeI16(self, v) return self end
	function DebugBinaryWriter:writeI32(v: number) self:_tag("readI32") BinaryWriter.writeI32(self, v) return self end
	function DebugBinaryWriter:writeF32(v: number) self:_tag("readF32") BinaryWriter.writeF32(self, v) return self end
	function DebugBinaryWriter:writeF64(v: number) self:_tag("readF64") BinaryWriter.writeF64(self, v) return self end
	function DebugBinaryWriter:writeBool(v: boolean) self:_tag("readBool") BinaryWriter.writeBool(self, v) return self end
	function DebugBinaryWriter:writeVarInt(v: number) self:_tag("readVarInt") BinaryWriter.writeVarInt(self, v) return self end

	function DebugBinaryWriter:writeStringU8(s: string) self:_tag("readStringU8") BinaryWriter.writeStringU8(self, s) return self end
	function DebugBinaryWriter:writeStringU16(s: string) self:_tag("readStringU16") BinaryWriter.writeStringU16(self, s) return self end
	function DebugBinaryWriter:writeStringU32(s: string) self:_tag("readStringU32") BinaryWriter.writeStringU32(self, s) return self end
	function DebugBinaryWriter:writeString(s: string) self:_tag("readString") BinaryWriter.writeString(self, s) return self end
	function DebugBinaryWriter:writeCString(s: string) self:_tag("readCString") BinaryWriter.writeCString(self, s) return self end

	function DebugBinaryWriter:writeVector2F32(v) self:_tag("readVector2F32") BinaryWriter.writeVector2F32(self, v) return self end
	function DebugBinaryWriter:writeVector2I16(v) self:_tag("readVector2I16") BinaryWriter.writeVector2I16(self, v) return self end
	function DebugBinaryWriter:writeVector2I32(v) self:_tag("readVector2I32") BinaryWriter.writeVector2I32(self, v) return self end
	function DebugBinaryWriter:writeVector3F32(v) self:_tag("readVector3F32") BinaryWriter.writeVector3F32(self, v) return self end
	function DebugBinaryWriter:writeVector3I16(v) self:_tag("readVector3I16") BinaryWriter.writeVector3I16(self, v) return self end
	function DebugBinaryWriter:writeVector3I32(v) self:_tag("readVector3I32") BinaryWriter.writeVector3I32(self, v) return self end
	function DebugBinaryWriter:writeVector4F32(v) self:_tag("readVector4F32") BinaryWriter.writeVector4F32(self, v) return self end
	function DebugBinaryWriter:writeVector4I16(v) self:_tag("readVector4I16") BinaryWriter.writeVector4I16(self, v) return self end
	function DebugBinaryWriter:writeVector4I32(v) self:_tag("readVector4I32") BinaryWriter.writeVector4I32(self, v) return self end

	function DebugBinaryWriter:writeColor3F32(v) self:_tag("readColor3F32") BinaryWriter.writeColor3F32(self, v) return self end
	function DebugBinaryWriter:writeColor3U8(v) self:_tag("readColor3U8") BinaryWriter.writeColor3U8(self, v) return self end
	function DebugBinaryWriter:writeColor4F32(v) self:_tag("readColor4F32") BinaryWriter.writeColor4F32(self, v) return self end
	function DebugBinaryWriter:writeColor4U8(v) self:_tag("readColor4U8") BinaryWriter.writeColor4U8(self, v) return self end

	function DebugBinaryWriter:writeCFrame(v) self:_tag("readCFrame") BinaryWriter.writeCFrame(self, v) return self end
end

-- A drop-in replacement for `BinaryReader` that asserts a `DebugOpcode` tag byte
-- before every read. Throws immediately with a precise position and
-- expected/actual opcode name if the stream does not match what was written.
--
-- `_assertTag` calls `BinaryReaderPrimitive.readU8` directly to consume the opcode
-- byte without triggering the overridden `readU8`, so the opcode byte is never
-- double-checked. Structured methods call `BinaryReader.readXxx` directly, so no
-- spurious component assertions fire inside a structured read.
local DebugBinaryReader = setmetatable({}, BinaryReader) do
	DebugBinaryReader.__index = DebugBinaryReader

	-- readStringOfSize is intentionally not tagged — it is a raw utility method.

	-- @param buf buffer? Optional buffer to read from immediately.
	function DebugBinaryReader.new(buf: buffer?)
		local self = setmetatable(BinaryReader.new(buf), DebugBinaryReader)
		self.log = {} :: { string }
		return self
	end

	-- Reads the next byte via `BinaryReaderPrimitive.readU8` (bypassing the override)
	-- and asserts it matches the expected opcode for `opcodeName`.
	-- Throws with a diagnostic message if there is a mismatch.
	function DebugBinaryReader:_assertTag(opcodeName: string)
		local expected = DebugOpcode[opcodeName]
		local actual = BinaryReaderPrimitive.readU8(self) -- bypass override
		table.insert(self.log, opcodeName)
		if actual ~= expected then
			local actualName = DebugOpcodeToName[actual]
				or string.format("unknown(0x%02x)", actual)
			error(string.format(
				"Stream mismatch at position %d: expected %s (0x%02x), got %s (0x%02x)",
				self._position - 1, opcodeName, expected, actualName, actual
			), 2)
		end
	end

	function DebugBinaryReader:readU8(): number self:_assertTag("readU8") return BinaryReader.readU8(self) end
	function DebugBinaryReader:readU16(): number self:_assertTag("readU16") return BinaryReader.readU16(self) end
	function DebugBinaryReader:readU32(): number self:_assertTag("readU32") return BinaryReader.readU32(self) end
	function DebugBinaryReader:readI8(): number self:_assertTag("readI8") return BinaryReader.readI8(self) end
	function DebugBinaryReader:readI16(): number self:_assertTag("readI16") return BinaryReader.readI16(self) end
	function DebugBinaryReader:readI32(): number self:_assertTag("readI32") return BinaryReader.readI32(self) end
	function DebugBinaryReader:readF32(): number self:_assertTag("readF32") return BinaryReader.readF32(self) end
	function DebugBinaryReader:readF64(): number self:_assertTag("readF64") return BinaryReader.readF64(self) end
	function DebugBinaryReader:readBool(): boolean self:_assertTag("readBool") return BinaryReader.readBool(self) end
	function DebugBinaryReader:readVarInt(): number self:_assertTag("readVarInt") return BinaryReader.readVarInt(self) end

	function DebugBinaryReader:readStringU8(): string self:_assertTag("readStringU8") return BinaryReader.readStringU8(self) end
	function DebugBinaryReader:readStringU16(): string self:_assertTag("readStringU16") return BinaryReader.readStringU16(self) end
	function DebugBinaryReader:readStringU32(): string self:_assertTag("readStringU32") return BinaryReader.readStringU32(self) end
	function DebugBinaryReader:readString(): string self:_assertTag("readString") return BinaryReader.readString(self) end
	function DebugBinaryReader:readCString(): string self:_assertTag("readCString") return BinaryReader.readCString(self) end

	function DebugBinaryReader:readVector2F32() self:_assertTag("readVector2F32") return BinaryReader.readVector2F32(self) end
	function DebugBinaryReader:readVector2I16() self:_assertTag("readVector2I16") return BinaryReader.readVector2I16(self) end
	function DebugBinaryReader:readVector2I32() self:_assertTag("readVector2I32") return BinaryReader.readVector2I32(self) end
	function DebugBinaryReader:readVector3F32() self:_assertTag("readVector3F32") return BinaryReader.readVector3F32(self) end
	function DebugBinaryReader:readVector3I16() self:_assertTag("readVector3I16") return BinaryReader.readVector3I16(self) end
	function DebugBinaryReader:readVector3I32() self:_assertTag("readVector3I32") return BinaryReader.readVector3I32(self) end
	function DebugBinaryReader:readVector4F32() self:_assertTag("readVector4F32") return BinaryReader.readVector4F32(self) end
	function DebugBinaryReader:readVector4I16() self:_assertTag("readVector4I16") return BinaryReader.readVector4I16(self) end
	function DebugBinaryReader:readVector4I32() self:_assertTag("readVector4I32") return BinaryReader.readVector4I32(self) end

	function DebugBinaryReader:readColor3F32() self:_assertTag("readColor3F32") return BinaryReader.readColor3F32(self) end
	function DebugBinaryReader:readColor3U8() self:_assertTag("readColor3U8") return BinaryReader.readColor3U8(self) end
	function DebugBinaryReader:readColor4F32() self:_assertTag("readColor4F32") return BinaryReader.readColor4F32(self) end
	function DebugBinaryReader:readColor4U8() self:_assertTag("readColor4U8") return BinaryReader.readColor4U8(self) end

	function DebugBinaryReader:readCFrame() self:_assertTag("readCFrame") return BinaryReader.readCFrame(self) end

end

return {
	clearBinaryHexData = clearBinaryHexData,
	BinaryContainer = BinaryContainer,
	BinaryReaderPrimitive = BinaryReaderPrimitive,
	BinaryReader = BinaryReader,
	BinaryWriterPrimitive = BinaryWriterPrimitive,
	BinaryWriter = BinaryWriter,
	ValueType = ValueType,
	BinaryReaderTyped = BinaryReaderTyped,
	BinaryWriterTyped = BinaryWriterTyped,
	DebugOpcode = DebugOpcode,
	DebugOpcodeToName = DebugOpcodeToName,
	DebugBinaryWriter = DebugBinaryWriter,
	DebugBinaryReader = DebugBinaryReader,
}
