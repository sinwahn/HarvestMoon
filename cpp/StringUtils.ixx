module;
#include "StringUtils.h"
export module HarvestMoon.StringUtils;

export import <string>;

export namespace HarvestMoon
{
	using ::HarvestMoon::writeUtf8;

	using ::HarvestMoon::isNewline;
	using ::HarvestMoon::isTab;
	using ::HarvestMoon::isBlank;
	using ::HarvestMoon::isWhitespaceNoLine;
	using ::HarvestMoon::isWhitespace;
	using ::HarvestMoon::isSpaceNoLine;
	using ::HarvestMoon::isSpace;
	using ::HarvestMoon::isLower;
	using ::HarvestMoon::isUpper;
	using ::HarvestMoon::isAlpha;
	using ::HarvestMoon::isDigit;
	using ::HarvestMoon::isHexDigit;
	using ::HarvestMoon::isHexDigit;
	using ::HarvestMoon::isAlnum;
	using ::HarvestMoon::isEof;
	using ::HarvestMoon::isBackspace;
	using ::HarvestMoon::isControlCode;
	using ::HarvestMoon::isControlCodeNoEof;
	using ::HarvestMoon::isCntrl;
	using ::HarvestMoon::isXDigit;
	using ::HarvestMoon::isBasicPunct;
	using ::HarvestMoon::isMidPunct;
	using ::HarvestMoon::isBracketPunct;
	using ::HarvestMoon::isCurlyPunct;
	using ::HarvestMoon::isPunct;
	using ::HarvestMoon::isGraph;
	using ::HarvestMoon::isPrint;

	using ::HarvestMoon::toInt;
	using ::HarvestMoon::toDouble;
	using ::HarvestMoon::toString;

	using ::HarvestMoon::pointerToString;
	using ::HarvestMoon::stringToPointer;
}