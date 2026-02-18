export module HarvestMoon.Iterator;

import <iterator>;

export namespace HarvestMoon
{
	template<typename Iter>
	concept InputIterator_c = std::input_iterator<Iter>;

	template<typename Iter, typename Value>
	concept MoveIterator_c = InputIterator_c<Iter> &&
		std::is_convertible_v<
		std::remove_reference_t<typename std::iterator_traits<Iter>::reference>,
		Value&&
	>;

	template <typename Iter>
		requires InputIterator_c<Iter>
	std::move_iterator<Iter> makeMoveIterator(Iter iter) {
		return std::move_iterator<Iter>(std::move(iter));
	}
}