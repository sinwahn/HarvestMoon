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
		if (istype(value, t0, t1, t2, t3, t4, t5, t6, t7))
			return value
		// we are in the error anyway, who cares
		const typeNames = [t0, t1, t2, t3, t4, t5, t6, t7].filter(Boolean)
		raise_typeerror(`'${typeNames.join(" | ")}' expected, got '${typeof value}'`)
	}

	function isinstanceof(
		value,
		c0 = undefined, c1 = undefined, c2 = undefined, c3 = undefined,
		c4 = undefined, c5 = undefined, c6 = undefined, c7 = undefined
	) {
		if (c0 !== undefined) {
			if (typeof c0 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c0)
				return true
		}

		if (c1 !== undefined) {
			if (typeof c1 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c1)
				return true
		}

		if (c2 !== undefined) {
			if (typeof c2 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c2)
				return true
		}

		if (c3 !== undefined) {
			if (typeof c3 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c3)
				return true
		}

		if (c4 !== undefined) {
			if (typeof c4 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c4)
				return true
		}

		if (c5 !== undefined) {
			if (typeof c5 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c5)
				return true
		}

		if (c6 !== undefined) {
			if (typeof c6 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c6)
				return true
		}

		if (c7) {
			if (typeof c7 !== "function")
				raise_typeerror("classes must be functions")
			if (value instanceof c7)
				return true
		}

		return false
	}

	function expectinstanceof(
		value,
		c0 = undefined, c1 = undefined, c2 = undefined, c3 = undefined,
		c4 = undefined, c5 = undefined, c6 = undefined, c7 = undefined
	) {
	
		if (isinstanceof(value, t0, t1, t2, t3, t4, t5, t6, t7))
			return value

		// we are in the error anyway, who cares
		const classNames = [c0, c1, c2, c3, c4, c5, c6, c7]
			.filter(Boolean)
			.map(c => c.name || "<anonymous>")

		const expected = classNames.join(" | ")
		const actual =
			value === null ? "null" :
			value?.constructor?.name ?? typeof value

		raise_typeerror(`'${expected}' expected, got '${actual}'`)
	}

	function istypeorinstance(
		value,
		c0 = undefined, c1 = undefined, c2 = undefined, c3 = undefined,
		c4 = undefined, c5 = undefined, c6 = undefined, c7 = undefined
	) {
		const t = typeof value
		if (c0 !== undefined)
		{
			if (typeof c0 === "function") { if (value instanceof c0) return true }
			else if (typeof c0 === "string") { if (t === c0) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c1 !== undefined)
		{
			if (typeof c1 === "function") { if (value instanceof c1) return true }
			else if (typeof c1 === "string") { if (t === c1) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c2 !== undefined)
		{
			if (typeof c2 === "function") { if (value instanceof c2) return true }
			else if (typeof c2 === "string") { if (t === c2) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c3 !== undefined)
		{
			if (typeof c3 === "function") { if (value instanceof c3) return true }
			else if (typeof c3 === "string") { if (t === c3) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c4 !== undefined)
		{
			if (typeof c4 === "function") { if (value instanceof c4) return true }
			else if (typeof c4 === "string") { if (t === c4) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c5 !== undefined)
		{
			if (typeof c5 === "function") { if (value instanceof c5) return true }
			else if (typeof c5 === "string") { if (t === c5) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c6 !== undefined)
		{
			if (typeof c6 === "function") { if (value instanceof c6) return true }
			else if (typeof c6 === "string") { if (t === c6) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}
		if (c7 !== undefined)
		{
			if (typeof c7 === "function") { if (value instanceof c7) return true }
			else if (typeof c7 === "string") { if (t === c7) return true }
			else raise_typeerror("classes/primitives must be functions/string")
		}

		return false
	}

	function expecttypeorinstance(
		value,
		c0 = undefined, c1 = undefined, c2 = undefined, c3 = undefined,
		c4 = undefined, c5 = undefined, c6 = undefined, c7 = undefined
	) {

		if (istypeorinstance(value, t0, t1, t2, t3, t4, t5, t6, t7))
			return value

		// we are in the error anyway, who cares
		const classNames = [c0, c1, c2, c3, c4, c5, c6, c7]
			.filter(Boolean)
			.map(c => typeof(c) == 'string' ? c : c.name || "<anonymous>")

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
})();