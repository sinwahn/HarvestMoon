export module HarvestMoon.UnorderedSet;

import <unordered_set>;
export import <stdexcept>;
import <initializer_list>;

import HarvestMoon.Common;
import HarvestMoon.Traits;
import HarvestMoon.Pointers;
import HarvestMoon.Vector;

export namespace HarvestMoon
{
	template<
		typename Value,
		typename Hasher = std::hash<Value>,
		ErrorKeyHandler<Value> invalidElementHandler = nullptr,
		ErrorKeyHandler<Value> duplicateElementHandler = nullptr
	>
	class UnorderedSet
	{
	protected:
		using Set_t = std::unordered_set<Value, Hasher>;
		Set_t set;

	public:
		using value_t = Value;
		using iter_t = decltype(set)::iterator;
		using citer_t = decltype(set)::const_iterator;

		static_assert(
			Eq_c<Value>,
			"Value type must have '==' operator defined"
		);

		static_assert(
			Hashable_c<Value, Hasher>,
			"Value type must be hashable (provide std::hash<Value> specialization, SEE !!copy-paste one bellow!! OR write custom hasher)"
		);
		/*
		namespace std {
			template <>
			struct hash<Value> {
				std::size_t operator()(const Value& value) const noexcept {
					return std::hash<std::string>()(value);
				}
			};
		}
		*/

		UnorderedSet() = default;

		UnorderedSet(const UnorderedSet& other)
		{
			checkCopyConstructible<Value>();
			set = other.set;
		}

		UnorderedSet(UnorderedSet&& other) noexcept
			: set(std::move(other.set))
		{
			checkMoveConstructible<Value>();
		}

		UnorderedSet& operator=(const UnorderedSet& other)
		{
			checkCopyAssignable<Value>();
			if (this != &other)
				set = other.set;
			return *this;
		}

		UnorderedSet& operator=(UnorderedSet&& other) noexcept
		{
			checkMoveAssignable<Value>();
			if (this != &other)
				set = std::move(other.set);
			return *this;
		}

		template <typename InputIter>
		UnorderedSet(InputIter first, InputIter last)
		{
			static_assert(std::input_iterator<InputIter>, "InputIter must be an input iterator");
			static_assert(std::convertible_to<std::iter_value_t<InputIter>, Value>, "The value type of InputIter must be convertible to Value");
			set.insert(first, last);
		}

		UnorderedSet(std::initializer_list<value_t> list)
			: set(list)
		{

		}

		constexpr size_t getSize() const noexcept { return set.size(); }
		constexpr bool isEmpty() const noexcept { return set.empty(); }

		void clear() noexcept { set.clear(); }

		constexpr bool isFront(const citer_t& pos) const noexcept { return pos == cbegin(); }
		constexpr bool isEnd(const citer_t& pos) const noexcept { return pos == cend(); }

		constexpr iter_t begin() noexcept { return set.begin(); }
		constexpr iter_t end() noexcept { return set.end(); }

		constexpr citer_t begin() const noexcept { return set.cbegin(); }
		constexpr citer_t end() const noexcept { return set.cend(); }

		constexpr citer_t cbegin() const noexcept { return set.cbegin(); }
		constexpr citer_t cend() const noexcept { return set.cend(); }

		bool operator==(const UnorderedSet& other) const {
			return set == other.set;
		}

		iter_t findPos(const Value& of) { return set.find(of); }
		citer_t findPos(const Value& of) const { return set.find(of); }

		template <typename T>
		iter_t findPos(T& of)
			requires isSmartPtr_v<Value>
		{
			return std::find_if(begin(), end(),
				[&of](auto& ptr) {
					return &getPointerValue(ptr) == toPointer(of);
				}
			);
		}

		template <typename T>
		citer_t findPos(T& of) const
			requires isSmartPtr_v<Value>
		{
			return std::find_if(begin(), end(),
				[&of](auto& ptr) {
					return &getPointerValue(ptr) == toPointer(of);
				}
			);
		}

		template <typename T = Value>
		bool contains(T&& value) const noexcept {
			return !isEnd(findPos(value));
		}

		template <typename... Args>
		const Value& insert(Args&&... args)
		{
			checkConstructible<Value>(std::forward<Args>(args)...);
			auto [it, inserted] = set.emplace(std::forward<Args>(args)...);
			if (!inserted)
				throwDuplicateElement(*it);
			return *it;
		}

		template <typename... Args>
		bool tryInsert(Args&&... args) {
			return set.emplace(std::forward<Args>(args)...).second;
		}

		template <typename T = const Value&>
		void remove(T&& value)
		{
			auto iter = findPos(std::forward<T>(value));
			if (isEnd(iter))
				throwInvalidElement(std::forward<T>(value));
			erase(iter);
		}

		template <typename T = const Value&>
		bool tryRemove(T&& value)
		{
			auto pos = findPos(std::forward<T>(value));
			if (isEnd(pos))
				return false;
			erase(pos);
			return true;
		}

		void erase(const iter_t& pos) {
			set.erase(pos);
		}

		void forEach(auto&& func) const
			requires std::invocable<decltype(func), const Value&>
		{
			for (const auto& value : set)
				func(value);
		}

		Vector<Value> toVector() const {
			Vector<Value> result;
			result.reserve(getSize());
			for (const auto& value : set)
				result.createAtBack(value);
			return result;
		}

	private:
		[[noreturn]] void throwInvalidElement(const Value& element)
		{
			if constexpr (invalidElementHandler)
				invalidElementHandler(element);
			else
				raise("element does not exist");
		}

		[[noreturn]] void throwInvalidElement(const Value&&)
		{
			raise("element does not exist");
		}

		[[noreturn]] void throwDuplicateElement(const Value& element)
		{
			if constexpr (duplicateElementHandler)
				duplicateElementHandler(element);
			else
				raise("duplicate element");
		}
	};
}