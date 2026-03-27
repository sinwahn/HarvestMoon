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
		const result = new ObjectWalker(obj, this.errorCallbacks, location, this.dead)
		return result
	}

	getSubLocation(nextFieldName) {
		if (nextFieldName)
			return `${this.location}.${nextFieldName}`
		return this.location
	}

	step(fieldName, isOptional = false) {
		const nextLocation = this.getSubLocation(fieldName)
		const value = this.obj?.[fieldName] ?? null

		if (value == null && !isOptional) {
			this.onMissingField(nextLocation)
		}

		const result = this._newWalker(value, nextLocation)
		if (value == null)
			result.onMissingField(nextLocation, isOptional)
		return result
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

	findBy(callback, isOptional = false, debugFindByMessage = 'unnamed condition') {
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
		return this._newWalker(undefined, nextLocation)
			.onMissingField(nextLocation, isOptional)
	}

	at(index, isOptional = false) {
		const nextLocation = this.getSubLocation(index)

		if (!Array.isArray(this.obj)) {
			return this._newWalker(undefined, nextLocation)
				.onMissingField(nextLocation, `not an array, cannot access index ${index}`)
		}

		const value = this.obj[index]
		const result = this._newWalker(value, nextLocation)
		if (value == null)
			result.onMissingField(nextLocation, isOptional)
		return result
	}

	value() { return this.obj }
	exists() { return this.obj != null }
	isArray() { return Array.isArray(this.obj) }
	length() { return Array.isArray(this.obj) ? this.obj.length : null }

	onMissingField(location, isOptional, message) {
		if (!this.dead) {
			this.setDead()
			if (!isOptional)
				this.errorCallbacks.onMissingField(location, message)
		}
		return this
	}

	onBadIteratable(location, isOptional, message) {
		if (!this.dead) {
			this.setDead()
			if (!isOptional)
				this.errorCallbacks.onBadIteratable(location, message)
		}
		return this
	}

	setDead() {
		this.dead = true
	}

	toString() {
		return `[ObjectWalker location="${this.location}" exists=${this.exists()} valueType=${typeof this.obj}]`
	}
}