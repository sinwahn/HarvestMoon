class ObjectWalkerErrorCallbacks {
	onMissingField = () => { }
	onBadIteratable = () => { }
}

const kLogObjectWalkerErrorCallbacks = new ObjectWalkerErrorCallbacks()
kLogObjectWalkerErrorCallbacks.onMissingField = (location, optionalMessage) => { console.warn(optionalMessage, location) }
kLogObjectWalkerErrorCallbacks.onBadIteratable = (location, optionalMessage) => { console.warn(optionalMessage, location) }

class ObjectWalker {
	constructor(obj, errorCallbacks = kLogObjectWalkerErrorCallbacks, location = '>', dead) {
		this.obj = obj
		this.errorCallbacks = errorCallbacks
		this.location = location
		this.dead = dead
	}

	_newWalker(obj, location) {
		return new ObjectWalker(obj, this.errorCallbacks, location, this.dead)
	}

	getSubLocation(nextFieldName) {
		if (nextFieldName)
			return `${this.location}.${nextFieldName}`
		return this.location
	}

	step(fieldName, optional = false) {
		const nextLocation = this.getSubLocation(fieldName)
		const value = this.obj?.[fieldName] ?? null

		if (value == null && !optional) {
			this.onMissingField(nextLocation)
		}

		return this._newWalker(value, nextLocation)
	}

	forEach(callback) {
		const location = this.location

		if (this.obj == null) {
			this.onBadIteratable(location, `cannot iterate null/undefined`)
			return this
		}

		if (Array.isArray(this.obj)) {
			for (let index = 0; index < this.obj.length; index++) {
				const value = this.obj[index]
				const itemLocation = this.getSubLocation(index)
				const itemWalker = this._newWalker(value, itemLocation)
				if (callback(itemWalker, index) === false)
					return this
			}
		} else if (this.obj && typeof this.obj === 'object') {
			for (const [key, value] of Object.entries(this.obj)) {
				const itemLocation = this.getSubLocation(key)
				const itemWalker = this._newWalker(value, itemLocation)
				if (callback(itemWalker, key) === false)
					return this
			}
		} else {
			this.onBadIteratable(location, `expected array or object, got ${typeof this.obj}`)
		}

		return this
	}

	findBy(callback, optional = false, debugFindByMessage = 'unnamed condition') {
		let result = null;

		this.forEach((itemWalker, key) => {
			if (callback(itemWalker, key)) {
				result = itemWalker;
				return false;
			}
		});

		if (result)
			return result

		const nextLocation = this.getSubLocation(`[findBy:${debugFindByMessage}]`)
		if (!optional)
			this.onMissingField(nextLocation)
		return this._newWalker(undefined, nextLocation)
	}

	at(index, optional = false) {
		const nextLocation = this.getSubLocation(index)

		if (!Array.isArray(this.obj)) {
			this.onMissingField(nextLocation, `not an array, cannot access index ${index}`)
			return this._newWalker(undefined, nextLocation)
		}

		const value = this.obj[index] ?? null
		if (value == null && !optional) {
			this.onMissingField(nextLocation)
		}

		return this._newWalker(value, nextLocation)
	}

	value() { return this.obj }
	exists() { return this.obj != null }
	isArray() { return Array.isArray(this.obj) }
	length() { return Array.isArray(this.obj) ? this.obj.length : null }

	onMissingField(location, message) {
		if (!this.dead) {
			this.onErrorHit()
			this.errorCallbacks.onMissingField(location, message)
		}
	}

	onBadIteratable(location, message) {
		if (!this.dead) {
			this.onErrorHit()
			this.errorCallbacks.onBadIteratable(location, message)
		}
	}

	onErrorHit() { this.dead = true }

	toString() {
		return `[ObjectWalker location="${this.location}" exists=${this.exists()} valueType=${typeof this.obj}]`
	}
}