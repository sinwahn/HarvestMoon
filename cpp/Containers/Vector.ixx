export module HarvestMoon.Vector;

import <vector>;
import <functional>;
export import <stdexcept>;

import HarvestMoon.Pointers;

import HarvestMoon.Common;
import HarvestMoon.Traits;
import HarvestMoon.Iterator;

export namespace HarvestMoon
{
	export template<
		typename Value,
		[[noreturn]] ErrorIndexHandler<size_t> invalidIndexHandler = nullptr
	>
	class Vector
	{
	protected:
		using container_t = std::vector<Value>;

		container_t vec;

	public:
		using value_t = Value;
		using index_t = size_t;

		using iter_t = typename container_t::iterator;
		using riter_t = typename container_t::reverse_iterator;
		using citer_t = typename container_t::const_iterator;
		using rciter_t = typename container_t::const_reverse_iterator;

		using elementConstPred = std::function<bool(const Value&)>;

		size_t getSize() const noexcept { return vec.size(); }
		bool isEmpty() const noexcept { return vec.empty(); }

		void clear() noexcept { vec.clear(); }
		void reserve(size_t newCapacity) { vec.reserve(newCapacity); }
		void resize(size_t newSize) { vec.resize(newSize); }

		bool isFront(const citer_t& pos) const { return pos == vec.begin(); }
		bool isEnd(const citer_t& pos) const { return pos == vec.end(); }

		constexpr iter_t begin() noexcept { return vec.begin(); }
		constexpr iter_t end() noexcept { return vec.end(); }

		constexpr citer_t begin() const noexcept { return vec.cbegin(); }
		constexpr citer_t end() const noexcept { return vec.cend(); }

		constexpr citer_t cbegin() const noexcept { return vec.cbegin(); }
		constexpr citer_t cend() const noexcept { return vec.cend(); }

		constexpr riter_t rbegin() noexcept { return vec.rbegin(); }
		constexpr riter_t rend() noexcept { return vec.rend(); }

		constexpr Value& front() noexcept { return vec.front(); }
		constexpr const Value& front() const noexcept { return vec.front(); }

		constexpr Value& back() noexcept { return vec.back(); }
		constexpr const Value& back() const noexcept { return vec.back(); }

		constexpr Value& at(index_t pos) noexcept { return vec.at(pos); }
		constexpr const Value& at(index_t pos) const noexcept { return vec.at(pos); }

		constexpr Value& operator[](index_t pos) noexcept { return vec[pos]; }
		constexpr const Value& operator[](index_t pos) const noexcept { return vec[pos]; }

		iter_t findPos(const Value& of) { return std::find(begin(), end(), of); }
		citer_t findPos(const Value& of) const { return std::find(begin(), end(), of); }

		iter_t findPos(const elementConstPred& pred) {
			return std::find_if(begin(), end(), [&](const auto& value) {
				return pred(value);
			});
		}

		citer_t findPos(const elementConstPred& pred) const {
			return std::find_if(begin(), end(), [&](const auto& value) {
				return pred(value);
			});
		}

		template <typename T>
		iter_t findPos(T&& of)
			requires isSmartPtr_v<Value> || (std::is_pointer_v<Value> && std::is_same_v<refToPtr_t<T>, Value>)
		{
			return std::find_if(begin(), end(),
				[&](auto& ptr) { return &getPointerValue(ptr) == toPointer(std::forward<T>(of)); });
		}

		riter_t findRPos(const Value& of) {
			return std::find(rbegin(), rend(), of);
		}

		template <typename T = const Value&>
			requires std::is_convertible_v<T, const Value&>
		|| std::is_same_v<T, elementConstPred>
			bool contains(T&& value) const {
			return !isEnd(findPos(std::forward<T>(value)));
		}

		const Value* findByValue(const Value& of) const
		{
			auto iter = findPos(of);
			if (isEnd(iter))
				return nullptr;
			return &*iter;
		}

		iter_t erase(iter_t pos) {
			return vec.erase(pos);
		}

		iter_t erase(iter_t from, iter_t to) {
			return vec.erase(from, to);
		}

		Value removeAndCreateCopy(iter_t pos)
		{
			Value value = std::move(*pos);
			vec.erase(pos);
			return value;
		}

		Value removeAndCreateCopy(index_t index) {
			return removeAndCreateCopy(begin() + index);
		}

		template <typename T = Value>
		bool tryRemoveByValue(const T& value)
		{
			auto iter = findPos(value);
			if (!isEnd(iter))
			{
				vec.erase(iter);
				return true;
			}
			return false;
		}

		template <typename T = Value>
		void removeByValue(const T& value)
		{
			if (!tryRemoveByValue(value))
				raise("value does not exist");
		}

		size_t removeAllByValue(const Value& value)
		{
			size_t count = 0;
			auto it = vec.begin();
			while (it != vec.end())
			{
				if (*it == value)
				{
					it = vec.erase(it);
					count++;
				}
				else
					it++;
			}
			return count;
		}

		template <typename... Args>
		Value& createAtBack(Args&&... args)
		{
			checkConstructible<Value>(std::forward<Args>(args)...);
			vec.emplace_back(std::forward<Args>(args)...);
			return vec.back();
		}

		void insert(index_t index, const Value& value) {
			vec.insert(vec.begin() + index, value);
		}

		template<typename Iter>
			requires InputIterator_c<Iter>
		void insert(const citer_t& at, const Iter& from, const Iter& to) {
			vec.insert(at, from, to);
		}

		void popBack() {
			vec.pop_back();
		}

		Value popBackAndCreateCopy() {
			return removeAndCreateCopy(end() - 1);
		}

		void forEach(auto&& func)
			requires std::invocable<decltype(func), index_t, Value&>
		{
			for (size_t i = 0; i < vec.size(); i++)
				func(i, vec[i]);
		}

		void forEach(auto&& func) const
			requires std::invocable<decltype(func), index_t, const Value&>
		{
			for (size_t i = 0; i < vec.size(); i++)
				func(i, vec[i]);
		}

	protected:
		[[noreturn]] void throwInvalidIndex(index_t index) const
		{
			if constexpr (invalidIndexHandler)
				invalidIndexHandler(index);
			else
				raise("index out of bounds");
		}
	};
}