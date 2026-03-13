module;
#include "Traits.h"
export module HarvestMoon.Traits;

export import <type_traits>;

export namespace HarvestMoon
{
	using ::HarvestMoon::satisfiesIfCVRefStripped_v;
	using ::HarvestMoon::isAnyOf_v;
	using ::HarvestMoon::ValueHandler;
	using ::HarvestMoon::ConstValueHandler;
	using ::HarvestMoon::ErrorKeyHandler;
	using ::HarvestMoon::ErrorIndexHandler;
	using ::HarvestMoon::Hashable_c;
	using ::HarvestMoon::Eq_c;
	using ::HarvestMoon::TemplateArrayArgument;
	using ::HarvestMoon::TemplateStringArgument;
}