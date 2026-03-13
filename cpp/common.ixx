module;
#include "Common.h"
export module HarvestMoon.Common;

export import <stdexcept>;

export namespace HarvestMoon
{
	using ::HarvestMoon::raise;
	using ::HarvestMoon::allocate;
	using ::HarvestMoon::checkConstructible;
	using ::HarvestMoon::checkCopyConstructible;
	using ::HarvestMoon::checkMoveConstructible;
	using ::HarvestMoon::checkCopyAssignable;
	using ::HarvestMoon::checkMoveAssignable;
}