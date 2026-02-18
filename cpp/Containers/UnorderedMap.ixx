export module HarvestMoon.UnorderedMap;

import <unordered_map>;
export import <stdexcept>;

import HarvestMoon.Traits;
import HarvestMoon.Common;
import HarvestMoon.Vector;

export namespace HarvestMoon
{
	export template<
		typename Key,
		typename Value,
		typename Hasher = std::hash<Key>,
		typename Base = Key,
		ErrorKeyHandler<Base> invalidKeyHandler = nullptr,
		ErrorKeyHandler<Base> duplicateKeyHandler = nullptr
	>
	class UnorderedMap_PolymorphicErrorHandlers
	{
	protected:
		using container_t = std::unordered_map<Key, Value, Hasher>;
		container_t map;
	public:
		using key_t = Key;
		using value_t = Value;

		using iter_t = typename container_t::iterator;
		using citer_t = typename container_t::const_iterator;

		static_assert(
			Eq_c<Key>,
			"Key type must have '==' operator defined"
		);

		static_assert(
			Hashable_c<Key, Hasher>,
			"Key type must be hashable (provide std::hash<Key> specialization, SEE !!copy-paste one bellow!! OR write custom hasher)"
		);
		/*
		namespace std {
			template <>
			struct hash<Key> {
				std::size_t operator()(const Key& value) const noexcept {
					return std::hash<std::string>()(value);
				}
			};
		}
		*/

		bool isEmpty() const noexcept { return map.empty(); }
		size_t getSize() const noexcept { return map.size(); }

		void clear() noexcept { map.clear(); }

		bool isFront(const citer_t& pos) const noexcept { return pos == cbegin(); }
		bool isEnd(const citer_t& pos) const noexcept { return pos == cend(); }

		constexpr iter_t begin() noexcept { return map.begin(); }
		constexpr iter_t end() noexcept { return map.end(); }

		constexpr citer_t begin() const noexcept { return map.cbegin(); }
		constexpr citer_t end() const noexcept { return map.cend(); }

		constexpr citer_t cbegin() const noexcept { return map.cbegin(); }
		constexpr citer_t cend() const noexcept { return map.cend(); }

		bool operator==(const UnorderedMap_PolymorphicErrorHandlers& other) const {
			return map == other.map;
		}

		Value* find(const Key& key)
		{
			auto pos = findPos(key);
			if (isEnd(pos))
				return nullptr;
			return &pos->second;
		}

		const Value* find(const Key& key) const
		{
			auto pos = findPos(key);
			if (isEnd(pos))
				return nullptr;
			return &pos->second;
		}

		iter_t findPos(const Key& key) { return map.find(key); }
		citer_t findPos(const Key& key) const { return map.find(key); }

		iter_t findPosByValue(const Value& value)
		{
			auto it = begin();
			for (; it != end(); it++)
				if (it->second == value)
					break;
			return it;
		}

		citer_t findPosByValue(const Value& value) const
		{
			auto it = begin();
			for (; it != end(); it++)
				if (it->second == value)
					break;
			return it;
		}

		bool contains(const Key& key) const {
			return !isEnd(findPos(key));
		}

		Value& get(const Key& key)
		{
			if (auto existing = find(key))
				return *existing;
			throwInvalidKey(key);
		}

		const Value& get(const Key& key) const
		{
			if (auto existing = find(key))
				return *existing;
			throwInvalidKey(key);
		}

		template <typename... Args>
		Value& create(const Key& key, Args&&... args)
		{
			checkConstructible<Value>(std::forward<Args>(args)...);
			if (auto existing = find(key))
				throwDuplicateKey(key);
			return emplace(key, std::forward<Args>(args)...).first->second;
		}

		void insert(const Key& key, const Value& value) {
			map[key] = value;
		}

		void insert(std::move_iterator<iter_t> begin, std::move_iterator<iter_t> end) {
			map.insert(begin, end);
		}

		void set(const Key& key, const Value& value) {
			map[key] = value;
		}

		template <typename... Args>
		Value& getOrCreate(const Key& key, Args&&... args)
		{
			checkConstructible<Value>(std::forward<Args>(args)...);
			return emplace(key, std::forward<Args>(args)...).first->second;
		}

		template <typename... Args>
		Value& setOrCreate(const Key& key, Args&&... args)
		{
			checkConstructible<Value>(std::forward<Args>(args)...);
			checkCopyAssignable<Value>();
			return map.insert_or_assign(key, Value(std::forward<Args>(args)...)).first->second;
		}

		void forEach(auto&& func)
			requires std::invocable<decltype(func), const Key&, Value&>
		{
			for (auto& pair : map)
				func(pair.first, pair.second);
		}

		void forEach(auto&& func) const
			requires std::invocable<decltype(func), const Key&, const Value&>
		{
			for (const auto& pair : map)
				func(pair.first, pair.second);
		}

		void remove(const Key& key)
		{
			auto pos = findPos(key);
			if (isEnd(pos))
				throwInvalidKey(key);
			erase(pos);
		}

		Value removeAndCreateCopy(const Key& key)
		{
			auto pos = findPos(key);
			if (isEnd(pos))
				throwInvalidKey(key);
			Value value = std::move(pos->second);
			erase(pos);
			return value;
		}

		bool tryRemoveByValue(const Value& value)
		{
			auto pos = findPosByValue(value);
			if (isEnd(pos))
				return false;
			erase(pos);
			return true;
		}

		void removeByValue(const Value& value)
		{
			if (!tryRemoveByValue(value))
				raise("value does not exist");
		}

		size_t removeAllByValue(const Value& value)
		{
			size_t count = 0;
			auto it = map.begin();
			while (it != map.end())
			{
				if (it->second == value)
				{
					it = map.erase(it);
					count++;
				}
				else
					it++;
			}
			return count;
		}

		iter_t erase(iter_t pos) {
			return map.erase(pos);
		}

		Vector<Key> keys() const {
			Vector<Key> result;
			result.reserve(getSize());
			for (const auto& pair : map)
				result.createAtBack(pair.first);
			return result;
		}

		Vector<Value> values() const {
			Vector<Value> result;
			result.reserve(getSize());
			for (const auto& pair : map)
				result.createAtBack(pair.second);
			return result;
		}

	protected:

		template <typename... Args>
		auto emplace(const Key& key, Args&&... args)
		{
			checkConstructible<Value>(std::forward<Args>(args)...);
			return map.emplace(
				std::piecewise_construct,
				std::forward_as_tuple(key),
				std::forward_as_tuple(std::forward<Args>(args)...)
			);
		}

		[[noreturn]] void throwInvalidKey(const Key& key) const
		{
			if constexpr (invalidKeyHandler)
				invalidKeyHandler(key);
			else
				raise("key does not exist");
		}

		[[noreturn]] void throwDuplicateKey(const Key& key) const
		{
			if constexpr (duplicateKeyHandler)
				duplicateKeyHandler(key);
			else
				raise("duplicate key");
		}

	};

	export template<
		typename Key,
		typename Value,
		ErrorKeyHandler<Key> invalidKeyHandler = nullptr,
		ErrorKeyHandler<Key> duplicateKeyHandler = nullptr
	>

	class UnorderedMap : public UnorderedMap_PolymorphicErrorHandlers<Key, Value, std::hash<Key>, Key, invalidKeyHandler, duplicateKeyHandler>
	{

	};

	export template<
		typename Key,
		typename Value,
		typename Hasher,
		ErrorKeyHandler<Key> invalidKeyHandler = nullptr,
		ErrorKeyHandler<Key> duplicateKeyHandler = nullptr
	>

	class UnorderedMap_Hasher : public UnorderedMap_PolymorphicErrorHandlers<Key, Value, Hasher, Key, invalidKeyHandler, duplicateKeyHandler>
	{

	};
}