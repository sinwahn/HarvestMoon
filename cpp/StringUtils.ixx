export module HarvestMoon.StringUtils;

export import <string>;
import <optional>;
import <stdarg.h>;
import <charconv>;

export namespace HarvestMoon
{
	size_t writeUtf8(char* data, unsigned int code)
	{
		// U+0000..U+007F
		if (code < 0x80)
		{
			data[0] = char(code);
			return 1;
		}
		// U+0080..U+07FF
		else if (code < 0x800)
		{
			data[0] = char(0xC0 | (code >> 6));
			data[1] = char(0x80 | (code & 0x3F));
			return 2;
		}
		// U+0800..U+FFFF
		else if (code < 0x10000)
		{
			data[0] = char(0xE0 | (code >> 12));
			data[1] = char(0x80 | ((code >> 6) & 0x3F));
			data[2] = char(0x80 | (code & 0x3F));
			return 3;
		}
		// U+10000..U+10FFFF
		else if (code < 0x110000)
		{
			data[0] = char(0xF0 | (code >> 18));
			data[1] = char(0x80 | ((code >> 12) & 0x3F));
			data[2] = char(0x80 | ((code >> 6) & 0x3F));
			data[3] = char(0x80 | (code & 0x3F));
			return 4;
		}
		else
		{
			return 0;
		}
	}

	constexpr bool isNewline(char c) {
		return c == '\n';
	}

	constexpr bool isTab(char c) {
		return c == '\t';
	}

	constexpr bool isBlank(char c) {
		return c == ' ' || isTab(c);
	}

	constexpr bool isWhitespaceNoLine(char c) {
		return c == '\v' || c == '\f' || c == '\r';
	}

	constexpr bool isWhitespace(char c) {
		return isNewline(c) || isWhitespaceNoLine(c);
	}

	constexpr bool isSpaceNoLine(char c) {
		return isWhitespaceNoLine(c) || isBlank(c);
	}

	constexpr bool isSpace(char c) {
		return isWhitespace(c) || isBlank(c);
	}

	constexpr bool isLower(char c) {
		return c >= 'a' && c <= 'z';
	}
	constexpr bool isUpper(char c) {
		return c >= 'A' && c <= 'Z';
	}

	constexpr bool isAlpha(char ch)
	{
		// use or trick to convert to lower case and unsigned comparison to do range check
		return unsigned((ch | ' ') - 'a') < 26;
	}

	constexpr bool isDigit(char ch) {
		return unsigned(ch - '0') < 10;
	}

	constexpr bool isHexDigit(char ch)
	{
		// use or trick to convert to lower case and unsigned comparison to do range check
		return unsigned(ch - '0') < 10 || unsigned((ch | ' ') - 'a') < 6;
	}

	constexpr bool isAlnum(char c) {
		return isAlpha(c) || isDigit(c);
	}

	constexpr bool isEof(char c) {
		return c == 0;
	}

	constexpr bool isBackspace(char c) {
		return c == 127;
	}

	constexpr bool isControlCode(char c) {
		return c >= 0 && c <= 31;
	}

	constexpr bool isControlCodeNoEof(char c) {
		return c >= 1 && c <= 31;
	}

	constexpr bool isCntrl(char c) {
		return isControlCodeNoEof(c) || isBackspace(c);
	}

	constexpr bool isXDigit(char c) {
		return isDigit(c) || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');
	}

	constexpr bool isBasicPunct(char c) {
		return c >= '!' && c <= '/'; // !"#$%&'()*+,-./
	}

	constexpr bool isMidPunct(char c) {
		return c >= ':' && c <= '@'; // :;<=>?@
	}

	constexpr bool isBracketPunct(char c) {
		return c >= '[' && c <= '`'; // [\]^_`
	}

	constexpr bool isCurlyPunct(char c) {
		return c >= '{' && c <= '~'; // {|}~
	}

	constexpr bool isPunct(char c) {
		return isBasicPunct(c) || isMidPunct(c) || isBracketPunct(c) || isCurlyPunct(c);
	}

	constexpr bool isGraph(char c) {
		return isAlnum(c) || isPunct(c);
	}

	constexpr bool isPrint(char c) {
		return isGraph(c) || c == ' ';
	}

	constexpr std::optional<int> toInt(std::string_view string, int base = 10)
	{
		int result;
		auto [ptr, ec] = std::from_chars(string.data(), string.data() + string.size(), result, base);

		if (ec == std::errc() && ptr == string.data() + string.size())
			return result;
		return std::nullopt;
	}

	constexpr std::optional<int> toInt(const char* string, int base = 10) {
		return toInt(std::string_view(string), base);
	}

	constexpr std::optional<int> toInt(const std::string& string, int base = 10) {
		return toInt(std::string_view(string), base);
	}

	std::optional<double> toDouble(std::string_view string)
	{
		double result;
		auto [ptr, ec] = std::from_chars(string.data(), string.data() + string.size(), result);

		if (ec == std::errc() && ptr == string.data() + string.size())
			return result;
		return std::nullopt;
	}

	std::optional<double> toDouble(const char* string) {
		return toDouble(std::string_view(string));
	}

	std::optional<double> toDouble(const std::string& string) {
		return toDouble(std::string_view(string));
	}

	std::string toString(double value)
	{
		char buffer[32];
		auto [ptr, ec] = std::to_chars(buffer, buffer + sizeof(buffer), value,
			std::chars_format::general, 14);
		// TODO:
		//assert(ec != std::errc());
		return std::string(buffer, ptr);
	}

	std::string pointerToString(void* pointer)
	{
		char buffer[20];
		sprintf_s(buffer, sizeof(buffer), "%p", pointer);
		return std::string(buffer);
	}

	std::string pointerToString(uintptr_t pointer) {
		return pointerToString((void*)pointer);
	}

	uintptr_t stringToPointer(const char* str) {
		return std::strtoull(str, nullptr, 16);
	}

	uintptr_t stringToPointer(const std::string& str) {
		return stringToPointer(str.c_str());
	}
}