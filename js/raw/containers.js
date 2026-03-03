export class Container {}

class _ArrayLike extends Container {
	_data

	constructor(...args) {
		super()
		this._data = new globalThis.Array(...args)
	}

	getSize() { return this._data.length }
	isEmpty() { return this._data.length === 0 }  // BUG FIX: was `>= 0`, always true

	clear() { this._data.length = 0 }

	getData() { return this._data }

	*[Symbol.iterator]() {
		for (const element of this._data)
			yield element
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

export class Vector extends _ArrayLike {

	constructor(...args) {
		super(...args)
	}

	copy() {
		return new Vector(...this._data)
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
		assert(item !== undefined)
		this._data.push(item)
	}

	popBack() {
		assert(!this.isEmpty(), "vector is empty")
		return this._data.pop()
	}

	// Insert at arbitrary index, shifting elements right
	insert(index, item) {
		assert(item !== undefined)
		assert(index >= 0 && index <= this.getSize(), `index out of bounds: ${index}`)
		this._data.splice(index, 0, item)
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
		if (index === undefined)
			return undefined
		return this.remove(index)
	}

	removeByValue(value) {
		const removedValue = this.removeByValueNoThrow(value)
		if (removedValue === undefined)
			raise(`value not found '${value}'`)
		return removedValue
	}

	removeByValueNoThrow(value) {
		const index = this.findPos(value)
		if (index === undefined)
			return undefined
		return this.remove(index)
	}

	sort(predicate = undefined) {
		this._data.sort(predicate)
	}

	map(predicate) {
		return new Vector(...this._data.map(predicate))
	}

	filter(predicate) {
		return new Vector(...this._data.filter(predicate))
	}

	reduce(predicate, initialValue) {
		return this._data.reduce(predicate, initialValue)
	}
}

export class Map extends Container {
	_data

	constructor(...args) {
		super()
		this._data = new globalThis.Map(...args)
	}

	clear() { this._data.clear() }
	getSize() { return this._data.size }
	isEmpty() { return this._data.size === 0 }
	getData() { return this._data }

	*[Symbol.iterator]() {
		for (const element of this._data)
			yield element
	}

	copy() {
		return new Map(this._data)
	}

	keys() {
		return new Vector(...this._data.keys())
	}

	values() {
		return new Vector(...this._data.values())
	}

	entries() {
		return new Vector(...this._data.entries())
	}

	contains(key) {
		return this._data.has(key)
	}

	containsBy(predicate) {
		for (const [key, value] of this._data)
			if (predicate(key, value))
				return true
		return false
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

	findValueBy(predicate) {
		for (const [key, value] of this._data)
			if (predicate(key, value))
				return value
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

	forEach(predicate) {
		for (const [key, value] of this._data)
			predicate(key, value)
	}

	writeData(writer, sizeWriteMethod, itemWritePredicate) {
		sizeWriteMethod(writer, this.getSize())
		for (const [key, value] of this._data)
			itemWritePredicate(writer, key, value)
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

// A map where each key maps to multiple values.
// Insertion order is preserved per key.
export class MultiMap extends Container {
	_data // globalThis.Map<key, Array<value>>
	_size // total number of key-value pairs across all keys

	constructor() {
		super()
		this._data = new globalThis.Map()
		this._size = 0
	}

	copy() {
		const copy = new MultiMap()
		for (const [key, values] of this._data)
			copy._data.set(key, [...values])
		copy._size = this._size
		return copy
	}

	clear() {
		this._data.clear()
		this._size = 0
	}

	// Total number of values across all keys
	getSize() { return this._size }

	// Number of distinct keys
	getKeyCount() { return this._data.size }

	isEmpty() { return this._size === 0 }

	getData() { return this._data }

	*[Symbol.iterator]() {
		for (const [key, values] of this._data)
			for (const value of values)
				yield [key, value]
	}

	contains(key) {
		return this._data.has(key)
	}

	containsValue(key, value) {
		const bucket = this._data.get(key)
		return bucket !== undefined && bucket.includes(value)
	}

	containsBy(predicate) {
		for (const [key, values] of this._data)
			for (const value of values)
				if (predicate(key, value))
					return true
		return false
	}

	// Returns a Vector of all values for the given key.
	// Raises if key does not exist.
	get(key) {
		if (!this._data.has(key))
			raise(`Key not found: ${key}`)
		return new Vector(...this._data.get(key))
	}

	// Returns a Vector of values, or undefined if key is absent.
	find(key) {
		const bucket = this._data.get(key)
		return bucket !== undefined ? new Vector(...bucket) : undefined
	}

	// Number of values stored under key, or 0 if absent.
	countValues(key) {
		const bucket = this._data.get(key)
		return bucket !== undefined ? bucket.length : 0
	}

	insert(key, value) {
		assert(value !== undefined)
		if (!this._data.has(key))
			this._data.set(key, [])
		this._data.get(key).push(value)
		this._size++
	}

	// Remove one occurrence of value under key. Raises if not found.
	remove(key, value) {
		const removed = this.tryRemove(key, value)
		if (!removed)
			raise(`Key-value pair not found: ${key}=${value}`)
	}

	// Remove one occurrence of value under key. Returns true if removed.
	tryRemove(key, value) {
		const bucket = this._data.get(key)
		if (bucket === undefined)
			return false
		const index = bucket.indexOf(value)
		if (index === -1)
			return false
		bucket.splice(index, 1)
		this._size--
		if (bucket.length === 0)
			this._data.delete(key)
		return true
	}

	// Remove all values for a key. Raises if key does not exist.
	removeAll(key) {
		if (!this._data.has(key))
			raise(`Key not found: ${key}`)
		this._size -= this._data.get(key).length
		this._data.delete(key)
	}

	// Remove all values for a key. Returns count removed, or 0 if absent.
	tryRemoveAll(key) {
		const bucket = this._data.get(key)
		if (bucket === undefined)
			return 0
		const count = bucket.length
		this._data.delete(key)
		this._size -= count
		return count
	}

	keys() {
		return new Vector(...this._data.keys())
	}

	// Flat Vector of all values across all keys (insertion order per key)
	values() {
		const result = []
		for (const bucket of this._data.values())
			for (const v of bucket)
				result.push(v)
		return new Vector(...result)
	}

	forEach(predicate) {
		for (const [key, values] of this._data)
			for (const value of values)
				predicate(key, value)
	}

	// Iterate once per key, receiving (key, Vector<values>)
	forEachKey(predicate) {
		for (const [key, values] of this._data)
			predicate(key, new Vector(...values))
	}

	findKeyByValue(toFind) {
		for (const [key, values] of this._data)
			if (values.includes(toFind))
				return key
		return undefined
	}

	findKeyBy(predicate) {
		for (const [key, values] of this._data)
			if (predicate(key, new Vector(...values)))
				return key
		return undefined
	}

	writeData(writer, sizeWriteMethod, itemWritePredicate) {
		sizeWriteMethod(writer, this._size)
		for (const [key, values] of this._data)
			for (const value of values)
				itemWritePredicate(writer, key, value)
	}

	readData(reader, sizeReadMethod, itemReadPredicate) {
		const count = sizeReadMethod(reader)
		this.clear()
		for (let i = 0; i < count; i++) {
			const [key, value] = itemReadPredicate(reader)
			assert(key !== undefined)
			assert(value !== undefined)
			this.insert(key, value)
		}
	}
}

export class Set extends Container {
	_data

	constructor(...args) {
		super()
		this._data = new globalThis.Set(...args)
	}

	*[Symbol.iterator]() {
		for (const element of this._data)
			yield element
	}

	getSize() { return this._data.size }
	isEmpty() { return this._data.size === 0 }

	clear() { this._data.clear() }

	getData() { return this._data }

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

	contains(key) {
		return this._data.has(key)
	}

	containsBy(predicate) {
		for (const [key, value] of this._data)
			if (predicate(key, value))
				return true
		return false
	}

	remove(value) {
		if (!this.tryRemove(value))
			raise("element does not exist")
		return true
	}

	tryRemove(value) {
		return this._data.delete(value)
	}

	forEach(predicate) {
		for (const value of this._data)
			predicate(value)
	}

	union(other) {
		const result = this.copy()
		for (const value of other)
			result.tryInsert(value)
		return result
	}

	intersection(other) {
		const result = new Set()
		for (const value of this._data)
			if (other.has(value))
				result.insert(value)
		return result
	}

	difference(other) {
		const result = new Set()
		for (const value of this._data)
			if (!other.has(value))
				result.insert(value)
		return result
	}

	copy() {
		return new Set(this._data)
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

export class Stack extends _ArrayLike {

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

export class Queue extends _ArrayLike {

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