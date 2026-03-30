/**
 * ObjectWalker — safe traversal of unverified deserialized data (JSON, XML, etc).
 *
 * The walker is the single validation boundary. Once data passes through it,
 * downstream code receives concrete values with defaults applied. No null checks
 * needed after extraction.
 *
 * Dead propagation: when a step fails (value is null/undefined), the returned
 * walker is "dead". All further operations on a dead walker are silent no-ops
 * that return empty/dead results. Dead state propagates only downward (to children),
 * never upward (to the parent), so sibling steps from the same parent are independent.
 */

export class ObjectWalkerCallbacks {
	onMissingField(location, message) { }
	onBadIterable(location, message) { }
}

export const kSilentCallbacks = new ObjectWalkerCallbacks()

export const kLogCallbacks = new ObjectWalkerCallbacks()
kLogCallbacks.onMissingField = (location, message) => {
	console.warn('[walker] missing:', location, message ?? '')
}
kLogCallbacks.onBadIterable = (location, message) => {
	console.warn('[walker] bad iterable:', location, message ?? '')
}

class _ArrayView {
	normalize(obj) {
		if (obj == null) return []
		if (Array.isArray(obj)) return obj
		return [obj]
	}
}

export class ObjectWalker {
	constructor(obj, callbacks = kLogCallbacks, location = '>', dead = false) {
		this.obj = obj
		this.callbacks = callbacks
		this.location = location
		this.dead = dead
		this._view = null   // attached view, not a constructor concern
	}

	/**
	 * Create a live child walker wrapping the given value.
	 * Inherits dead state from parent (if parent is dead, child is dead too).
	 */
	_child(obj, location) {
		return new ObjectWalker(obj, this.callbacks, location, this.dead)
	}

	/**
	 * Create an unconditionally dead child walker.
	 */
	_deadChild(location) {
		return new ObjectWalker(undefined, this.callbacks, location, true)
	}

	_sub(field) {
		return field != null ? `${this.location}.${field}` : this.location
	}

	// ---------------------------------------------------------------
	// Navigation
	// ---------------------------------------------------------------

	/**
	 * Step into a field by name. Returns a dead walker if the field is
	 * null/undefined. Reports an error unless optional is true.
	 *
	 * Parent walker is never affected — sibling steps are independent.
	 */
	step(field, optional = false) {
		const loc = this._sub(field)
		if (this.dead) return this._deadChild(loc)

		const value = this.obj?.[field] ?? null
		if (value == null) {
			if (!optional) this.callbacks.onMissingField(loc)
			return this._deadChild(loc)
		}
		return this._child(value, loc)
	}

	/**
	 * Traverse a dot-separated path. Intermediate steps are always optional
	 * (no noise for `a.b.c` when `a.b` is missing). Only the final step
	 * respects the optional flag.
	 */
	stepPath(path, optional = false) {
		const parts = path.split('.')
		let w = this
		for (let i = 0; i < parts.length; i++) {
			w = w.step(parts[i], i < parts.length - 1 || optional)
		}
		return w
	}

	/**
	 * Access an array element by index.
	 */
	at(index, optional = false) {
		const loc = this._sub(index)
		if (this.dead) return this._deadChild(loc)

		if (!Array.isArray(this.obj)) {
			if (!optional) this.callbacks.onBadIterable(loc, `not an array, cannot index [${index}]`)
			return this._deadChild(loc)
		}

		const value = this.obj[index]
		if (value == null) {
			if (!optional) this.callbacks.onMissingField(loc)
			return this._deadChild(loc)
		}
		return this._child(value, loc)
	}

	// ---------------------------------------------------------------
	// Value extraction
	// ---------------------------------------------------------------

	/** Raw value, or null if dead/missing. */
	value() {
		return this.dead ? null : (this.obj ?? null)
	}

	/** Raw value, or fallback if dead/missing. */
	valueOr(fallback) {
		return this.dead ? fallback : (this.obj ?? fallback)
	}

	/** True if alive and value is non-null. */
	exists() {
		return !this.dead && this.obj != null
	}

	isArray() {
		return !this.dead && Array.isArray(this.obj)
	}

	length() {
		return this.isArray() ? this.obj.length : 0
	}

	// ---------------------------------------------------------------
	// Views — named methods only, view types never leak to caller
	// ---------------------------------------------------------------

	/**
	 * Attach an array coercion view to this walker.
	 * Iteration will see a normalized array regardless of whether the
	 * underlying value is an array, a single node, or null.
	 */
	coerceArray() {
		if (this.dead) return this
		const w = this._child(this.obj, this.location)
		w._view = new _ArrayView()
		return w
	}
	
	// ---------------------------------------------------------------
	// Transform
	// ---------------------------------------------------------------

	/**
	 * Transform the value. Returns a dead walker if the input or output is null.
	 * Useful for inline conversions:
	 *   w.step('bytes', true).map(formatBytes).value()
	 */
	map(fn) {
		if (this.dead || this.obj == null) return this
		const result = fn(this.obj)
		if (result == null) return this._deadChild(this.location)
		return this._child(result, this.location)
	}

	// ---------------------------------------------------------------
	// Iteration
	// ---------------------------------------------------------------

	/**
	 * Iterate over array items or object entries. Return false from callback
	 * to break early. No-op if dead or not iterable.
	 */
	forEach(callback) {
		if (this.dead || this.obj == null) return this

		const src = this._view ? this._view.normalize(this.obj) : this.obj

		if (Array.isArray(src)) {
			for (let i = 0; i < src.length; i++) {
				const w = this._child(src[i], this._sub(i))
				if (callback(w, i) === false) break
			}
		} else if (typeof src === 'object') {
			for (const [key, val] of Object.entries(src)) {
				const w = this._child(val, this._sub(key))
				if (callback(w, key) === false) break
			}
		} else {
			this.callbacks.onBadIterable(this.location, `expected array/object, got ${typeof src}`)
		}
		return this
	}

	/**
	 * Map over items and collect results. Skips undefined returns.
	 */
	mapEach(callback) {
		const results = []
		this.forEach((w, key) => {
			const val = callback(w, key)
			if (val !== undefined) results.push(val)
		})
		return results
	}

	/**
	 * Filter array items by predicate. Returns a walker wrapping the filtered array.
	 */
	filter(predicate) {
		if (this.dead || !Array.isArray(this.obj)) return this._child([], this.location)
		const filtered = this.obj.filter((item, i) => {
			return predicate(this._child(item, this._sub(i)), i)
		})
		return this._child(filtered, this.location)
	}

	/**
	 * Find the first item matching a predicate. Returns a dead walker if not found.
	 */
	findBy(predicate, optional = false, debugLabel = '?') {
		let result = null
		this.forEach((w, key) => {
			if (predicate(w, key)) { result = w; return false }
		})
		if (result) return result

		const loc = this._sub(`[findBy:${debugLabel}]`)
		if (!optional) this.callbacks.onMissingField(loc, `no match for ${debugLabel}`)
		return this._deadChild(loc)
	}

	/**
	 * Build a plain object from an array of items.
	 * keyFn(walker, index) -> key, valueFn(walker, index) -> value.
	 * Skips entries where keyFn returns null.
	 */
	toRecord(keyFn, valueFn) {
		const result = {}
		this.forEach((w, i) => {
			const k = keyFn(w, i)
			if (k != null) result[k] = valueFn ? valueFn(w, i) : w.value()
		})
		return result
	}

	toString() {
		if (this.dead) return `[Walker ${this.location} DEAD]`
		return `[Walker ${this.location} ${typeof this.obj}]`
	}
}