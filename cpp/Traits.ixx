export module HarvestMoon.Traits;

export import <type_traits>;
import <string>;

export namespace HarvestMoon
{
	// "would T satisfy Trait if we stripped cvref?"
	template <template<typename> class Trait, typename T>
	constexpr bool satisfiesIfCVRefStripped_v =
		!Trait<T>::value && Trait<std::remove_cvref_t<T>>::value;

	template <typename T, typename... Types>
	constexpr bool isAnyOf_v = (std::is_same_v<T, Types> || ...);;

	template <typename Value>
	using ValueHandler = void(*)(Value&);

	template <typename Value>
	using ConstValueHandler = void(*)(const Value&);

	template <typename Key>
	using ErrorKeyHandler = ConstValueHandler<Key>;

	template <typename Index>
	using ErrorIndexHandler = ConstValueHandler<Index>;

	template <typename T, typename Hasher>
	concept Hashable_c = requires(T t, Hasher h)
	{
		{ h(t) } -> std::convertible_to<size_t>;
	};

	template <typename T>
	concept Eq_c = requires(T a, T b)
	{
		a == b;
	};

	template <typename T, size_t myLen>
	struct TemplateArrayArgument {
		T value[myLen];

		const inline static size_t length = myLen;

		consteval TemplateArrayArgument(const T(&str)[myLen]) {
			for (size_t i = 0; i < myLen; i++)
				value[i] = str[i];
		}

		consteval const T* data() const {
			return value;
		}

		template <size_t otherLen>
		consteval auto join(const TemplateArrayArgument<T, otherLen>& other) const {
			TemplateArrayArgument<T, myLen + otherLen> result{ {} };

			for (size_t i = 0; i < myLen; i++)
				result.value[i] = value[i];

			for (size_t i = 0; i < otherLen; i++)
				result.value[myLen + i] = other.value[i];

			return result;
		}

	};

	template <size_t myLen>
	struct TemplateStringArgument
	{
		char value[myLen];

		const inline static size_t length = myLen;

		consteval TemplateStringArgument(const char(&str)[myLen]) {
			for (size_t i = 0; i < myLen; i++)
				value[i] = str[i];
		}

		consteval const char* data() const {
			return value;
		}

		consteval std::string toString() const {
			return std::string(value, length);
		}

		template <size_t otherLen>
		consteval auto join(const TemplateStringArgument<otherLen>& other) const {
			TemplateStringArgument<myLen + otherLen - 1> result{ {} };

			for (size_t i = 0; i < myLen; i++)
				result.value[i] = value[i];

			for (size_t i = 0; i < otherLen; i++)
				result.value[myLen + i - 1] = other.value[i];

			return result;
		}
	};

	template <size_t myLen>
	TemplateStringArgument(const char(&)[myLen]) -> TemplateStringArgument<myLen>;
}