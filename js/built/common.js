// HarvestMoon - auto-generated bundle (common.js)
// DO NOT EDIT - edit source files in raw/ and re-run build.ps1

const HM = (() => {
	'use strict'
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
	// --- exports ---
	return {
		raise,
		raise_typeerror,
		assert,
		istype,
		expecttype,
		expectinstanceof,
	}
})()