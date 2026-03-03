// HarvestMoon - auto-generated (containers.js)
// DO NOT EDIT

const HM = (() => {
    'use strict'
	/** Base class for all container types. Provides a common type for instanceof checks. */
	class Container {}

	/**
	 * Internal base class for array-backed containers.
	 * Not intended for direct use — see {@link Vector}, {@link Stack}, {@link Queue}.
	 */
	class _ArrayLike extends Container {
		_data

		constructor(...args) {
			super()
			this._data = new globalThis.Array(...args)
		}

		/** Returns the number of elements in the container. */
		getSize() { return this._data.length }

		/** Returns true if the container holds no elements. */
		isEmpty() { return this._data.length === 0 }

		/** Removes all elements from the container. */
		clear() { this._data.length = 0 }

		/**
		 * Returns the underlying native Array.
		 * Prefer the container's own methods over mutating this directly.
		 * @returns {Array}
		 */
		getData() { return this._data }

		/** Iterates over each element in insertion order. */
		*[Symbol.iterator]() {
			for (const element of this._data)
				yield element
		}

		/**
		 * Returns the index of the first element strictly equal to `value`,
		 * or `undefined` if not found.
		 * @param {*} value
		 * @returns {number|undefined}
		 */
		findPos(value) {
			const index = this._data.indexOf(value)
			return index === -1 ? undefined : index
		}

		/**
		 * Returns the index of the first element for which `predicate` returns true,
		 * or `undefined` if no element matches.
		 * @param {function(value: *, index: number): boolean} predicate
		 * @returns {number|undefined}
		 */
		findPosBy(predicate) {
			for (let i = 0; i < this.getSize(); i++)
				if (predicate(this._data[i], i))
					return i
			return undefined
		}

		/**
		 * Calls `predicate` once for each element, passing `(value, index)`.
		 * @param {function(value: *, index: number): void} predicate
		 */
		forEach(predicate) {
			for (let i = 0; i < this.getSize(); i++)
				predicate(this._data[i], i)
		}

		/**
		 * Returns the number of elements loosely equal (`==`) to `value`.
		 * @param {*} value
		 * @returns {number}
		 */
		count(value) {
			let result = 0
			for (const item of this._data)
				if (value == item)
					result += 1
			return result
		}

		/**
		 * Returns the number of elements for which `predicate` returns true.
		 * @param {function(value: *, index: number): boolean} predicate
		 * @returns {number}
		 */
		countBy(predicate) {
			let result = 0
			for (let i = 0; i < this.getSize(); i++)
				if (predicate(this._data[i], i))
					result += 1
			return result
		}

		/**
		 * Serialises the container to `writer`.
		 * Calls `sizeWriteMethod(writer, size)` first, then `itemWritePredicate(writer, value)`
		 * for each element in order.
		 * @param {*} writer
		 * @param {function(writer: *, size: number): void} sizeWriteMethod
		 * @param {function(writer: *, value: *): void} itemWritePredicate
		 */
		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this.getSize())
			for (const value of this._data)
				itemWritePredicate(writer, value)
		}

		/**
		 * Deserialises the container from `reader`, replacing all current contents.
		 * Calls `sizeReadMethod(reader)` to get the element count, then
		 * `itemReadPredicate(reader)` that many times to read each element.
		 * @param {*} reader
		 * @param {function(reader: *): number} sizeReadMethod
		 * @param {function(reader: *): *} itemReadPredicate - must not return `undefined`
		 */
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

	/**
	 * A dynamic, ordered list of elements backed by a native Array.
	 *
	 * Supports random access, front/back operations, searching, sorting,
	 * and functional transforms. All index-based operations are bounds-checked.
	 *
	 * @example
	 * const v = new Vector(1, 2, 3)
	 * v.pushBack(4)
	 * v.get(0)       // 1
	 * v.contains(3)  // true
	 */
	class Vector extends _ArrayLike {

		constructor(...args) {
			super(...args)
		}

		/**
		 * Returns a shallow copy of this vector.
		 * @returns {Vector}
		 */
		copy() {
			return new Vector(...this._data)
		}

		/**
		 * Replaces the element at `index` with `value`.
		 * Throws if `index` is out of bounds.
		 * @param {number} index
		 * @param {*} value
		 */
		set(index, value) {
			expecttype(index, "number")
			assert(index >= 0, `index must be non-negative: ${index}`)
			assert(index < this.getSize(), `index out of bounds: ${index}`)
			this._data[index] = value
		}

		/**
		 * Returns the element at `index`.
		 * Throws if `index` is out of bounds.
		 * @param {number} index
		 * @returns {*}
		 */
		get(index) {
			assert(index >= 0 && index < this.getSize(), `vector index out of bounds: ${index}`)
			return this._data[index]
		}

		/**
		 * Returns the first element. Throws if the vector is empty.
		 * @returns {*}
		 */
		front() {
			assert(!this.isEmpty(), "vector is empty")
			return this._data[0]
		}

		/**
		 * Returns the last element. Throws if the vector is empty.
		 * @returns {*}
		 */
		back() {
			assert(!this.isEmpty(), "vector is empty")
			return this._data[this.getSize() - 1]
		}

		/**
		 * Appends `item` to the end of the vector.
		 * @param {*} item - must not be `undefined`
		 */
		pushBack(item) {
			assert(item !== undefined)
			this._data.push(item)
		}

		/**
		 * Removes and returns the last element. Throws if the vector is empty.
		 * @returns {*}
		 */
		popBack() {
			assert(!this.isEmpty(), "vector is empty")
			return this._data.pop()
		}

		/**
		 * Inserts `item` at `index`, shifting all subsequent elements one position to the right.
		 * `index` may equal `getSize()` to append at the end.
		 * Throws if `index` is out of bounds.
		 * @param {number} index
		 * @param {*} item - must not be `undefined`
		 */
		insert(index, item) {
			assert(item !== undefined)
			assert(index >= 0 && index <= this.getSize(), `index out of bounds: ${index}`)
			this._data.splice(index, 0, item)
		}

		/**
		 * Returns true if the vector contains an element strictly equal to `value`.
		 * @param {*} value
		 * @returns {boolean}
		 */
		contains(value) {
			return this.findPos(value) !== undefined
		}

		/**
		 * Returns true if any element satisfies `predicate`.
		 * @param {function(value: *, index: number): boolean} predicate
		 * @returns {boolean}
		 */
		containsBy(predicate) {
			return this.findPosBy(predicate) !== undefined
		}

		/**
		 * Removes and returns the element at `index`, shifting subsequent elements left.
		 * Throws if `index` is out of bounds.
		 * @param {number} index
		 * @returns {*}
		 */
		remove(index) {
			if (index < 0 || index >= this.getSize())
				raise(`index out of bounds: ${index}`)
			return this._data.splice(index, 1)[0]
		}

		/**
		 * Removes and returns the first element satisfying `predicate`.
		 * Returns `undefined` if no element matches.
		 * @param {function(value: *, index: number): boolean} predicate
		 * @returns {*|undefined}
		 */
		removeBy(predicate) {
			const index = this.findPosBy(predicate)
			if (index === undefined)
				return undefined
			return this.remove(index)
		}

		/**
		 * Removes and returns the first element strictly equal to `value`.
		 * Throws if `value` is not found. See {@link removeByValueNoThrow} for a non-throwing variant.
		 * @param {*} value
		 * @returns {*}
		 */
		removeByValue(value) {
			const removedValue = this.removeByValueNoThrow(value)
			if (removedValue === undefined)
				raise(`value not found '${value}'`)
			return removedValue
		}

		/**
		 * Removes and returns the first element strictly equal to `value`.
		 * Returns `undefined` if not found instead of throwing.
		 * @param {*} value
		 * @returns {*|undefined}
		 */
		removeByValueNoThrow(value) {
			const index = this.findPos(value)
			if (index === undefined)
				return undefined
			return this.remove(index)
		}

		/**
		 * Sorts the vector in place.
		 * Without a `predicate`, elements are sorted in ascending default JS order.
		 * @param {function(a: *, b: *): number} [predicate] - standard comparator: negative, zero, or positive
		 */
		sort(predicate = undefined) {
			this._data.sort(predicate)
		}

		/**
		 * Returns a new Vector containing the results of calling `predicate` on each element.
		 * @param {function(value: *, index: number): *} predicate
		 * @returns {Vector}
		 */
		map(predicate) {
			return new Vector(...this._data.map(predicate))
		}

		/**
		 * Returns a new Vector containing only the elements for which `predicate` returns true.
		 * @param {function(value: *, index: number): boolean} predicate
		 * @returns {Vector}
		 */
		filter(predicate) {
			return new Vector(...this._data.filter(predicate))
		}

		/**
		 * Reduces the vector to a single value by calling `predicate` on each element
		 * left-to-right, passing the accumulated result and current element.
		 * @param {function(accumulator: *, value: *, index: number): *} predicate
		 * @param {*} initialValue - the initial accumulator value
		 * @returns {*}
		 */
		reduce(predicate, initialValue) {
			return this._data.reduce(predicate, initialValue)
		}
	}

	/**
	 * An ordered key-value store where each key maps to exactly one value.
	 * Keys may be any type. Iteration order matches insertion order.
	 *
	 * For the throwing `get` / `set` / `remove` methods there are non-throwing
	 * counterparts: `find`, `setOrCreate`, and `tryRemove`.
	 *
	 * @example
	 * const m = new Map()
	 * m.create("a", 1)
	 * m.get("a")        // 1
	 * m.contains("a")   // true
	 */
	class Map extends Container {
		_data

		constructor(...args) {
			super()
			this._data = new globalThis.Map(...args)
		}

		/** Removes all key-value pairs. */
		clear() { this._data.clear() }

		/** Returns the number of key-value pairs. */
		getSize() { return this._data.size }

		/** Returns true if the map holds no key-value pairs. */
		isEmpty() { return this._data.size === 0 }

		/**
		 * Returns the underlying native Map.
		 * Prefer the container's own methods over mutating this directly.
		 * @returns {globalThis.Map}
		 */
		getData() { return this._data }

		/** Iterates over `[key, value]` pairs in insertion order. */
		*[Symbol.iterator]() {
			for (const element of this._data)
				yield element
		}

		/**
		 * Returns a shallow copy of this map.
		 * @returns {Map}
		 */
		copy() {
			return new Map(this._data)
		}

		/**
		 * Returns a Vector of all keys in insertion order.
		 * @returns {Vector}
		 */
		keys() {
			return new Vector(...this._data.keys())
		}

		/**
		 * Returns a Vector of all values in insertion order.
		 * @returns {Vector}
		 */
		values() {
			return new Vector(...this._data.values())
		}

		/**
		 * Returns a Vector of `[key, value]` pairs in insertion order.
		 * @returns {Vector<[*, *]>}
		 */
		entries() {
			return new Vector(...this._data.entries())
		}

		/**
		 * Returns true if a value is stored under `key`.
		 * @param {*} key
		 * @returns {boolean}
		 */
		contains(key) {
			return this._data.has(key)
		}

		/**
		 * Returns true if any key-value pair satisfies `predicate`.
		 * @param {function(key: *, value: *): boolean} predicate
		 * @returns {boolean}
		 */
		containsBy(predicate) {
			for (const [key, value] of this._data)
				if (predicate(key, value))
					return true
			return false
		}

		/**
		 * Updates the value for an existing `key`.
		 * Throws if `key` does not exist — use {@link create} to add new keys,
		 * or {@link setOrCreate} if you don't care which.
		 * @param {*} key
		 * @param {*} value - must not be `undefined`
		 */
		set(key, value) {
			if (!this._data.has(key))
				raise(`Key does not exist: ${key}`)
			assert(value !== undefined)
			this._data.set(key, value)
		}

		/**
		 * Inserts a new `key` with `value`.
		 * Throws if `key` already exists — use {@link set} to update existing keys,
		 * or {@link setOrCreate} if you don't care which.
		 * @param {*} key
		 * @param {*} value - must not be `undefined`
		 */
		create(key, value) {
			if (this._data.has(key))
				raise(`Key already exists: ${key}=${value}`)
			assert(value !== undefined)
			this._data.set(key, value)
		}

		/**
		 * Inserts or updates `key` with `value`, regardless of whether it already exists.
		 * @param {*} key
		 * @param {*} value - must not be `undefined`
		 */
		setOrCreate(key, value) {
			assert(value !== undefined)
			this._data.set(key, value)
		}

		/**
		 * Returns the value stored under `key`.
		 * Throws if `key` does not exist. See {@link find} for a non-throwing variant.
		 * @param {*} key
		 * @returns {*}
		 */
		get(key) {
			if (!this._data.has(key))
				raise(`Key not found: ${key}`)
			return this._data.get(key)
		}

		/**
		 * Returns the value stored under `key`, or `undefined` if the key does not exist.
		 * @param {*} key
		 * @returns {*|undefined}
		 */
		find(key) {
			return this._data.get(key)
		}

		/**
		 * Returns the first key whose value is loosely equal (`==`) to `toFind`,
		 * or `undefined` if not found.
		 * @param {*} toFind
		 * @returns {*|undefined}
		 */
		findKeyByValue(toFind) {
			for (const [key, value] of this._data)
				if (value == toFind)
					return key
			return undefined
		}

		/**
		 * Returns the first key for which `predicate(key, value)` returns true,
		 * or `undefined` if no pair matches.
		 * @param {function(key: *, value: *): boolean} predicate
		 * @returns {*|undefined}
		 */
		findKeyBy(predicate) {
			for (const [key, value] of this._data)
				if (predicate(key, value))
					return key
			return undefined
		}

		/**
		 * Returns the first value for which `predicate(key, value)` returns true,
		 * or `undefined` if no pair matches.
		 * @param {function(key: *, value: *): boolean} predicate
		 * @returns {*|undefined}
		 */
		findValueBy(predicate) {
			for (const [key, value] of this._data)
				if (predicate(key, value))
					return value
			return undefined
		}

		/**
		 * Removes `key` and returns its value.
		 * Throws if `key` does not exist. See {@link tryRemove} for a non-throwing variant.
		 * @param {*} key
		 * @returns {*}
		 */
		remove(key) {
			if (!this._data.has(key))
				raise(`Invalid key: ${key}`)
			const value = this._data.get(key)
			this._data.delete(key)
			return value
		}

		/**
		 * Removes `key` and returns its value, or `null` if the key does not exist.
		 * @param {*} key
		 * @returns {*|null}
		 */
		tryRemove(key) {
			if (!this._data.has(key))
				return null
			const value = this._data.get(key)
			this._data.delete(key)
			return value
		}

		/**
		 * Calls `predicate(key, value)` once for each key-value pair in insertion order.
		 * @param {function(key: *, value: *): void} predicate
		 */
		forEach(predicate) {
			for (const [key, value] of this._data)
				predicate(key, value)
		}

		/**
		 * Serialises the map to `writer`.
		 * Calls `sizeWriteMethod(writer, size)` first, then `itemWritePredicate(writer, key, value)`
		 * for each pair in insertion order.
		 * @param {*} writer
		 * @param {function(writer: *, size: number): void} sizeWriteMethod
		 * @param {function(writer: *, key: *, value: *): void} itemWritePredicate
		 */
		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this.getSize())
			for (const [key, value] of this._data)
				itemWritePredicate(writer, key, value)
		}

		/**
		 * Deserialises the map from `reader`, replacing all current contents.
		 * Calls `sizeReadMethod(reader)` to get the pair count, then
		 * `itemReadPredicate(reader)` that many times, each returning a `[key, value]` tuple.
		 * @param {*} reader
		 * @param {function(reader: *): number} sizeReadMethod
		 * @param {function(reader: *): [*, *]} itemReadPredicate - must not return `undefined` keys or values
		 */
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

	/**
	 * An ordered key-to-many-values store. Each key can hold any number of values,
	 * and duplicate values under the same key are allowed.
	 * Insertion order is preserved both across keys and within each key's values.
	 *
	 * {@link getSize} returns the total number of values across all keys.
	 * {@link getKeyCount} returns the number of distinct keys.
	 *
	 * @example
	 * const mm = new MultiMap()
	 * mm.insert("fruit", "apple")
	 * mm.insert("fruit", "banana")
	 * mm.insert("veggie", "carrot")
	 * mm.get("fruit")   // Vector ["apple", "banana"]
	 * mm.getSize()      // 3
	 * mm.getKeyCount()  // 2
	 */
	class MultiMap extends Container {
		/** @type {globalThis.Map<*, Array<*>>} */
		_data
		/** @type {number} total number of values across all keys */
		_size

		constructor() {
			super()
			this._data = new globalThis.Map()
			this._size = 0
		}

		/**
		 * Returns a shallow copy of this multimap.
		 * Each key's value array is copied, but the values themselves are not cloned.
		 * @returns {MultiMap}
		 */
		copy() {
			const copy = new MultiMap()
			for (const [key, values] of this._data)
				copy._data.set(key, [...values])
			copy._size = this._size
			return copy
		}

		/** Removes all keys and values. */
		clear() {
			this._data.clear()
			this._size = 0
		}

		/** Returns the total number of values across all keys. */
		getSize() { return this._size }

		/** Returns the number of distinct keys. */
		getKeyCount() { return this._data.size }

		/** Returns true if the multimap holds no values at all. */
		isEmpty() { return this._size === 0 }

		/**
		 * Returns the underlying native Map of key → Array<value>.
		 * Prefer the container's own methods over mutating this directly.
		 * @returns {globalThis.Map<*, Array<*>>}
		 */
		getData() { return this._data }

		/** Iterates over every `[key, value]` pair across all keys in insertion order. */
		*[Symbol.iterator]() {
			for (const [key, values] of this._data)
				for (const value of values)
					yield [key, value]
		}

		/**
		 * Returns true if any values are stored under `key`.
		 * @param {*} key
		 * @returns {boolean}
		 */
		contains(key) {
			return this._data.has(key)
		}

		/**
		 * Returns true if `value` appears at least once under `key`.
		 * @param {*} key
		 * @param {*} value
		 * @returns {boolean}
		 */
		containsValue(key, value) {
			const bucket = this._data.get(key)
			return bucket !== undefined && bucket.includes(value)
		}

		/**
		 * Returns true if any `[key, value]` pair satisfies `predicate`.
		 * @param {function(key: *, value: *): boolean} predicate
		 * @returns {boolean}
		 */
		containsBy(predicate) {
			for (const [key, values] of this._data)
				for (const value of values)
					if (predicate(key, value))
						return true
			return false
		}

		/**
		 * Returns a Vector of all values stored under `key`, in insertion order.
		 * Throws if `key` does not exist. See {@link find} for a non-throwing variant.
		 * @param {*} key
		 * @returns {Vector}
		 */
		get(key) {
			if (!this._data.has(key))
				raise(`Key not found: ${key}`)
			return new Vector(...this._data.get(key))
		}

		/**
		 * Returns a Vector of all values stored under `key`, or `undefined` if the key is absent.
		 * @param {*} key
		 * @returns {Vector|undefined}
		 */
		find(key) {
			const bucket = this._data.get(key)
			return bucket !== undefined ? new Vector(...bucket) : undefined
		}

		/**
		 * Returns the number of values stored under `key`, or 0 if the key is absent.
		 * @param {*} key
		 * @returns {number}
		 */
		countValues(key) {
			const bucket = this._data.get(key)
			return bucket !== undefined ? bucket.length : 0
		}

		/**
		 * Adds `value` under `key`. If `key` does not yet exist it is created automatically.
		 * Duplicate values under the same key are allowed.
		 * @param {*} key
		 * @param {*} value - must not be `undefined`
		 */
		insert(key, value) {
			assert(value !== undefined)
			if (!this._data.has(key))
				this._data.set(key, [])
			this._data.get(key).push(value)
			this._size++
		}

		/**
		 * Removes the first occurrence of `value` under `key`.
		 * Throws if the key-value pair does not exist. See {@link tryRemove} for a non-throwing variant.
		 * When the last value for a key is removed, the key is also removed.
		 * @param {*} key
		 * @param {*} value
		 */
		remove(key, value) {
			const removed = this.tryRemove(key, value)
			if (!removed)
				raise(`Key-value pair not found: ${key}=${value}`)
		}

		/**
		 * Removes the first occurrence of `value` under `key`.
		 * Returns true if removed, false if the key-value pair did not exist.
		 * When the last value for a key is removed, the key is also removed.
		 * @param {*} key
		 * @param {*} value
		 * @returns {boolean}
		 */
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

		/**
		 * Removes all values stored under `key`.
		 * Throws if `key` does not exist. See {@link tryRemoveAll} for a non-throwing variant.
		 * @param {*} key
		 */
		removeAll(key) {
			if (!this._data.has(key))
				raise(`Key not found: ${key}`)
			this._size -= this._data.get(key).length
			this._data.delete(key)
		}

		/**
		 * Removes all values stored under `key`.
		 * Returns the number of values removed, or 0 if the key did not exist.
		 * @param {*} key
		 * @returns {number}
		 */
		tryRemoveAll(key) {
			const bucket = this._data.get(key)
			if (bucket === undefined)
				return 0
			const count = bucket.length
			this._data.delete(key)
			this._size -= count
			return count
		}

		/**
		 * Returns a Vector of all distinct keys in insertion order.
		 * @returns {Vector}
		 */
		keys() {
			return new Vector(...this._data.keys())
		}

		/**
		 * Returns a flat Vector of all values across all keys in insertion order.
		 * @returns {Vector}
		 */
		values() {
			const result = []
			for (const bucket of this._data.values())
				for (const v of bucket)
					result.push(v)
			return new Vector(...result)
		}

		/**
		 * Calls `predicate(key, value)` once for every key-value pair across all keys,
		 * in insertion order.
		 * @param {function(key: *, value: *): void} predicate
		 */
		forEach(predicate) {
			for (const [key, values] of this._data)
				for (const value of values)
					predicate(key, value)
		}

		/**
		 * Calls `predicate(key, values)` once per distinct key, where `values` is a Vector
		 * of all values under that key in insertion order.
		 * @param {function(key: *, values: Vector): void} predicate
		 */
		forEachKey(predicate) {
			for (const [key, values] of this._data)
				predicate(key, new Vector(...values))
		}

		/**
		 * Returns the first key that contains `toFind` among its values (loose equality `==`),
		 * or `undefined` if no such key exists.
		 * @param {*} toFind
		 * @returns {*|undefined}
		 */
		findKeyByValue(toFind) {
			for (const [key, values] of this._data)
				if (values.includes(toFind))
					return key
			return undefined
		}

		/**
		 * Returns the first key for which `predicate(key, values)` returns true,
		 * where `values` is a Vector of that key's values.
		 * Returns `undefined` if no key matches.
		 * @param {function(key: *, values: Vector): boolean} predicate
		 * @returns {*|undefined}
		 */
		findKeyBy(predicate) {
			for (const [key, values] of this._data)
				if (predicate(key, new Vector(...values)))
					return key
			return undefined
		}

		/**
		 * Serialises the multimap to `writer` as a flat sequence of key-value pairs.
		 * Calls `sizeWriteMethod(writer, totalSize)` first, then `itemWritePredicate(writer, key, value)`
		 * for each pair across all keys in insertion order.
		 * @param {*} writer
		 * @param {function(writer: *, size: number): void} sizeWriteMethod
		 * @param {function(writer: *, key: *, value: *): void} itemWritePredicate
		 */
		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this._size)
			for (const [key, values] of this._data)
				for (const value of values)
					itemWritePredicate(writer, key, value)
		}

		/**
		 * Deserialises the multimap from `reader`, replacing all current contents.
		 * Calls `sizeReadMethod(reader)` to get the total pair count, then
		 * `itemReadPredicate(reader)` that many times, each returning a `[key, value]` tuple.
		 * Keys and values are re-inserted in the order they are read.
		 * @param {*} reader
		 * @param {function(reader: *): number} sizeReadMethod
		 * @param {function(reader: *): [*, *]} itemReadPredicate - must not return `undefined` keys or values
		 */
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

	/**
	 * An unordered collection of unique values. Inserting a duplicate is either
	 * silently ignored ({@link tryInsert}) or throws ({@link insert}).
	 *
	 * Supports set algebra via {@link union}, {@link intersection}, and {@link difference}.
	 *
	 * @example
	 * const s = new Set([1, 2, 3])
	 * s.insert(4)
	 * s.contains(2)  // true
	 * s.remove(2)
	 * s.getSize()    // 3
	 */
	class Set extends Container {
		_data

		constructor(...args) {
			super()
			this._data = new globalThis.Set(...args)
		}

		/** Iterates over each value in insertion order. */
		*[Symbol.iterator]() {
			for (const element of this._data)
				yield element
		}

		/** Returns the number of values in the set. */
		getSize() { return this._data.size }

		/** Returns true if the set holds no values. */
		isEmpty() { return this._data.size === 0 }

		/** Removes all values from the set. */
		clear() { this._data.clear() }

		/**
		 * Returns the underlying native Set.
		 * Prefer the container's own methods over mutating this directly.
		 * @returns {globalThis.Set}
		 */
		getData() { return this._data }

		/**
		 * Returns a Vector containing all values in insertion order.
		 * @returns {Vector}
		 */
		toVector() {
			return new Vector(...this._data)
		}

		/**
		 * Inserts `value` if it is not already present.
		 * Returns true if it was newly inserted, false if it was already in the set.
		 * @param {*} value - must not be `undefined`
		 * @returns {boolean}
		 */
		tryInsert(value) {
			assert(value !== undefined)
			const had = this.contains(value)
			this._data.add(value)
			return !had
		}

		/**
		 * Inserts `value`. Throws if `value` is already present.
		 * See {@link tryInsert} for a non-throwing variant.
		 * @param {*} value - must not be `undefined`
		 */
		insert(value) {
			const inserted = this.tryInsert(value)
			if (!inserted)
				raise("duplicate element")
		}

		/**
		 * Returns true if `value` is in the set.
		 * @param {*} value
		 * @returns {boolean}
		 */
		contains(value) {
			return this._data.has(value)
		}

		/**
		 * Returns true if any value satisfies `predicate`.
		 * @param {function(value: *): boolean} predicate
		 * @returns {boolean}
		 */
		containsBy(predicate) {
			for (const value of this._data)
				if (predicate(value))
					return true
			return false
		}

		/**
		 * Removes `value` from the set. Throws if `value` is not present.
		 * See {@link tryRemove} for a non-throwing variant.
		 * @param {*} value
		 */
		remove(value) {
			if (!this.tryRemove(value))
				raise("element does not exist")
		}

		/**
		 * Removes `value` from the set if present.
		 * Returns true if removed, false if the value was not in the set.
		 * @param {*} value
		 * @returns {boolean}
		 */
		tryRemove(value) {
			return this._data.delete(value)
		}

		/**
		 * Calls `predicate(value)` once for each value in insertion order.
		 * @param {function(value: *): void} predicate
		 */
		forEach(predicate) {
			for (const value of this._data)
				predicate(value)
		}

		/**
		 * Returns a new Set containing all values from both this set and `other`.
		 * Neither set is modified.
		 * @param {Set} other
		 * @returns {Set}
		 */
		union(other) {
			const result = this.copy()
			for (const value of other)
				result.tryInsert(value)
			return result
		}

		/**
		 * Returns a new Set containing only the values present in both this set and `other`.
		 * Neither set is modified.
		 * @param {Set} other
		 * @returns {Set}
		 */
		intersection(other) {
			const result = new Set()
			for (const value of this._data)
				if (other.contains(value))
					result.insert(value)
			return result
		}

		/**
		 * Returns a new Set containing only the values present in this set but not in `other`.
		 * Neither set is modified.
		 * @param {Set} other
		 * @returns {Set}
		 */
		difference(other) {
			const result = new Set()
			for (const value of this._data)
				if (!other.contains(value))
					result.insert(value)
			return result
		}

		/**
		 * Returns a shallow copy of this set.
		 * @returns {Set}
		 */
		copy() {
			return new Set(this._data)
		}

		/**
		 * Serialises the set to `writer`.
		 * Calls `sizeWriteMethod(writer, size)` first, then `itemWritePredicate(writer, value)`
		 * for each value in insertion order.
		 * @param {*} writer
		 * @param {function(writer: *, size: number): void} sizeWriteMethod
		 * @param {function(writer: *, value: *): void} itemWritePredicate
		 */
		writeData(writer, sizeWriteMethod, itemWritePredicate) {
			sizeWriteMethod(writer, this.getSize())
			for (const value of this._data)
				itemWritePredicate(writer, value)
		}

		/**
		 * Deserialises the set from `reader`, replacing all current contents.
		 * Calls `sizeReadMethod(reader)` to get the element count, then
		 * `itemReadPredicate(reader)` that many times to read each value.
		 * @param {*} reader
		 * @param {function(reader: *): number} sizeReadMethod
		 * @param {function(reader: *): *} itemReadPredicate - must not return `undefined`
		 */
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

	/**
	 * A last-in, first-out (LIFO) stack backed by an array.
	 * Add items with {@link push} and retrieve them in reverse order with {@link pop}.
	 *
	 * @example
	 * const s = new Stack()
	 * s.push(1)
	 * s.push(2)
	 * s.pop()   // 2
	 * s.top()   // 1
	 */
	class Stack extends _ArrayLike {

		constructor(...args) {
			super(...args)
		}

		/**
		 * Pushes `value` onto the top of the stack.
		 * @param {*} value - must not be `undefined`
		 */
		push(value) {
			assert(value !== undefined)
			this._data.push(value)
		}

		/**
		 * Removes and returns the top element.
		 * Throws if the stack is empty.
		 * @returns {*}
		 */
		pop() {
			if (this.isEmpty())
				raise("stack underflow")
			return this._data.pop()
		}

		/**
		 * Returns the top element without removing it.
		 * Throws if the stack is empty.
		 * @returns {*}
		 */
		top() {
			assert(!this.isEmpty(), "stack is empty")
			return this._data[this.getSize() - 1]
		}
	}

	/**
	 * A first-in, first-out (FIFO) queue backed by an array.
	 * Add items with {@link enqueue} and retrieve them in arrival order with {@link dequeue}.
	 *
	 * @example
	 * const q = new Queue()
	 * q.enqueue("a")
	 * q.enqueue("b")
	 * q.dequeue()   // "a"
	 * q.front()     // "b"
	 */
	class Queue extends _ArrayLike {

		constructor(...args) {
			super(...args)
		}

		/**
		 * Adds `value` to the back of the queue.
		 * @param {*} value - must not be `undefined`
		 */
		enqueue(value) {
			assert(value !== undefined)
			this._data.push(value)
		}

		/**
		 * Removes and returns the element at the front of the queue.
		 * Throws if the queue is empty.
		 * @returns {*}
		 */
		dequeue() {
			if (this.isEmpty())
				raise("queue underflow")
			return this._data.shift()
		}

		/**
		 * Returns the element at the front of the queue without removing it.
		 * Throws if the queue is empty.
		 * @returns {*}
		 */
		front() {
			if (this.isEmpty())
				raise("queue is empty")
			return this._data[0]
		}

		/**
		 * Returns the element at the back of the queue without removing it.
		 * Throws if the queue is empty.
		 * @returns {*}
		 */
		back() {
			if (this.isEmpty())
				raise("queue is empty")
			return this._data[this.getSize() - 1]
		}
	}
    return {
        Container,
        Map,
        MultiMap,
        Queue,
        Set,
        Stack,
        Vector,
    }
})();