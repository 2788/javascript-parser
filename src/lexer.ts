import { Parser } from "./parser";
import {
  isNewLineChar,
  nonASCIIwhitespace,
  isIdentifierCode,
  isKeyWords,
  isHexDigit,
  validateExponentPart,
  isLineTerminator as lineTerminatorReg,
  hexReg,
  identifierStartReg,
} from "./utils";
import { Token, AllTokens, TokenLiteral } from "./token";

// 正则表达式字面量可参考 https://github.com/sweet-js/sweet-core/wiki/design
// export interface Tokenizer {
//   readToken(): void;

//   readNumber(): void;

//   readString(): void;

//   readName(): void;

//   readRegexp(): void;

//   readKeyWords(): void;

//   skipLineComment(): void;

//   skipBlockComment(): void;

//   skipSpace(): void;

//   finishToken(): void;
// }

Parser.prototype.readToken = function () {};

// 读取Number, 进入这个分支可以确定是在Number上下文了
Parser.prototype.readNumber = function () {
  let ch = this.input[this.pos];
  let lookhead = this.input[this.pos + 1];
  // DecimalLiteral 在非'0'开头,则肯定是十进制, 或者`0.`开始
  if (ch !== "0" || (ch === "0" && lookhead === ".")) {
    this.readDecimalLiteral();
  } else if (ch === "0") {
    switch (lookhead) {
      case "b":
      case "B":
        this.readOtherRadixLiteral(2);
        break;
      case "o":
      case "O":
        this.readOtherRadixLiteral(8);
        break;
      case "x":
      case "X":
        this.readOtherRadixLiteral(16);
        break;
    }
  } else {
    this.raise("Invalid or unexpected token");
  }
};

// 读取字符串, 就是将字符串组成的字符的几种形式分别判断一下
// 一种就是普通的字符构成
// 第二种是LineContinuation, https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminatorSequence
// 第三种是转移字符 https://www.ecma-international.org/ecma-262/10.0/index.html#prod-EscapeSequence
Parser.prototype.readString = function () {
  let val = "";
  let startChar = this.input[this.pos];
  let normalCharReg =
    startChar === "'" ? /[^'\u000A\u000D]/ : /[^"\u000A\u000D]/;
  while (this.pos < this.input.length) {
    let code = this.fullCodePointAtPos();
    if (code === 92 && lineTerminatorReg.test(this.input[this.pos + 1])) {
      this.pos += 2;
      this.pos += this.input[this.pos] === String.fromCodePoint(10) ? 1 : 0; // 判断是否为 <CR>[lookahead ≠ <LF>]
    } else if (code === 92) {
      this.pos++;
      val += this.readEscapeSequence();
    } else if (normalCharReg.test(String.fromCodePoint(code))) {
      this.pos += code > 0xffff ? 2 : 1;
      val += String.fromCodePoint(code);
    }
  }
  if (this.input[this.pos] !== startChar) {
    this.raise("Invalid or unexpected token");
  }
};

Parser.prototype.readEscapeSequence = function (): string | never {
  switch (this.input[this.pos]) {
    case "x":
      if (
        hexReg.test(this.input[this.pos + 1]) &&
        hexReg.test(this.input[this.pos + 2])
      ) {
        this.pos += 3;
        return String.fromCodePoint(
          parseInt(this.input[(this.pos - 2, this.pos)], 16)
        );
      }
      return this.raise("Invalid hexadecimal escape sequence");
    case "u":
      return String.fromCodePoint(this.readCodePoint());
    case "0":
      if (/\d/.test(this.input[this.pos + 1])) {
        // lookhead 不能为十进制数字
        return this.raise("Octal escape sequences are not allowed");
      }
      return "";
    case "'":
      return "'";
    case '"':
      return '"';
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "v":
      return "\v";
  }
  return this.input[++this.pos];
};

Parser.prototype.readIdentifierOrKW = function () {
  let escape = false;
  let first = true;
  let name: string = "";
  while (this.pos < this.input.length) {
    let code = this.fullCodePointAtPos();
    if (
      (first && identifierStartReg.test(String.fromCodePoint(code))) ||
      isIdentifierCode(code)
    ) {
      this.pos += code > 0xffff ? 2 : 1;
      name += String.fromCodePoint(code);
    } else if (code == 92) {
      // '\'
      escape = true;
      name += this.readUnicodeEscapeSequence();
    } else {
      break;
    }
    first = false;
  }
  if (isKeyWords(name)) {
    if (escape) {
      this.raise("Keyword must not contain escaped characters");
    }
    this.tokenArr.push(new Token(AllTokens[<TokenLiteral>("_" + name)], name));
  } else {
    this.tokenArr.push(new Token(AllTokens.name, name));
  }
};

Parser.prototype.readRegexp = function () {};

Parser.prototype.readPunctuations = function () {};

Parser.prototype.readOp = function () {};

Parser.prototype.readUnicodeEscapeSequence = function (): string | never {
  if (this.input[++this.pos] == "u") {
    if (this.input[++this.pos] == "{") {
      this.pos++;
      let escapeChar = String.fromCodePoint(this.readCodePoint());
      return this.input[this.pos] == "}" ? escapeChar : "";
    } else {
      this.pos++;
      return String.fromCodePoint(this.readHex4Digits());
    }
  } else {
    return this.raise("Expecting Unicode escape sequence");
  }
};

Parser.prototype.readHex4Digits = function (): number | never {
  let count = 0;
  let start = this.pos;
  if (isHexDigit(this.input[this.pos]) && count < 4) {
    this.pos++;
    count++;
  }
  if (count != 4) {
    this.raise("Expected 4 HexDigits");
  }
  return Number.parseInt(this.input.slice(start, this.pos), 16);
};

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-CodePoint
Parser.prototype.readCodePoint = function (): number | never {
  let start = this.pos;
  while (isHexDigit(this.input[this.pos])) {
    this.pos++;
  }
  let codePoint = Number.parseInt(this.input.slice(start, this.pos), 16);
  if (codePoint > 0x10ffff) {
    return codePoint;
  } else {
    return this.raise("CodePoint must less than 0x10ffff");
  }
};

Parser.prototype.readDecimalLiteral = function () {
  let integerStart = this.pos;
  let integerPart: string = "",
    decimalPart: string = "",
    exponentPart: string = "";
  while (/\d/.test(this.input[this.pos])) {
    this.pos++;
  }
  integerPart = this.input.slice(integerStart, this.pos);
  if (this.input[this.pos] === ".") {
    this.pos += 2;
    let decimalPartStart = this.pos;
    while (/\d/.test(this.input[this.pos])) {
      this.pos++;
    }
    decimalPart = this.input.slice(decimalPartStart, this.pos);
  }
  if (this.input[this.pos] === "e" || this.input[this.pos] === "E") {
    this.pos++;
    let exponentPartStart = this.pos;
    while (/\d/.test(this.input[this.pos])) {
      this.pos++;
    }
    exponentPart = this.input.slice(exponentPartStart, this.pos);
  }
  if (
    (validateExponentPart(exponentPart) && integerPart.length > 0) ||
    (integerPart === "" && decimalPart.length > 0)
  ) {
    this.tokenArr.push(
      new Token(
        AllTokens.num,
        parseFloat(
          `${integerPart}.${decimalPart}${
            exponentPart.length ? "e" + exponentPart : ""
          }`
        )
      )
    );
  } else {
    this.raise("Invalid or unexpected token");
  }
};

Parser.prototype.readOtherRadixLiteral = function (radix: number) {
  let reg!: RegExp;
  switch (radix) {
    case 2:
      reg = /0|1/;
      break;
    case 8:
      reg = /[0-7]/;
      break;
    case 16:
      reg = /[0-9a-fA-F]/;
      break;
  }
  let start = this.pos;
  while (reg.test(this.input[this.pos])) {
    this.pos++;
  }
  let literal = this.input.slice(start, this.pos);
  if (literal.length) {
    this.tokenArr.push(new Token(AllTokens.num, parseInt(literal, radix)));
  } else {
    this.raise("Invalid or unexpected token");
  }
};

Parser.prototype.skipLineComment = function () {
  let ch = this.input[this.pos];
  while (this.pos < this.input.length && !isNewLineChar(ch)) {
    this.pos++;
    ch = this.input[this.pos];
  }
};

Parser.prototype.skipBlockComment = function () {
  while (this.pos < this.input.length) {
    if (this.input[this.pos] == "/" && this.input[this.pos - 1] == "*") {
      return;
    }
    this.pos++;
  }
  this.raise("Unterminated comment");
};

// 跳过所有空白,注释,换行
// https://ecma262.docschina.org/#sec-white-space
// 空白符的定义: <TAB> <VT> <FF> <SP> <NBSP> <ZWNBSP> <USP>
// <TAB> => \u0009(9)  <VT> => \u000B(11)  <FF> => \u000C(12)  <SP> => \u0020(32)
// <NBSP> => \u00A0(160) <ZWNBSP> => \uFEFF  <USP> => 是一个类别, 参考nonASCIIwhitespace
//
// https://ecma262.docschina.org/#sec-line-terminators
// 行终结符 <LF> <CR> <LS> <PS> => 10 13 8232 8233
// <CR><LF>两个字符如果在一起会被视为换行符,在记录行号的时候行号只会增加一行,而不是两行
//
Parser.prototype.skipSpace = function () {
  while (this.pos < this.input.length) {
    let ch = this.input[this.pos].charCodeAt(0);
    switch (ch) {
      // 空白符号
      case 32:
      case 160: // <SP> <NBSP>
        ++this.pos;
        break;

      // 换行
      // 处理\r\n情况
      // @ts-ignore
      case 13:
        if (this.input[this.pos + 1].charCodeAt(0) == 10) {
          this.pos++;
        }

      case 10:
      case 8232:
      case 8233:
        this.pos++;
        this.line++;
        break;

      case 47: // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
          case 42: // '*'
            this.skipBlockComment();
            break;
          case 47:
            this.skipLineComment();
            break;
          default:
            return; // 结束函数
        }
        break;

      default:
        // 9-13码点 或者 <USP>码点类别
        if (
          (ch > 8 && ch < 14) ||
          nonASCIIwhitespace.test(String.fromCodePoint(ch))
        ) {
          ++this.pos;
        } else {
          return; // 结束函数
        }
    }
  }
};

Parser.prototype.finishToken = function () {};

// acorn.js souce code
Parser.prototype.fullCodePointAtPos = function (): number {
  let code = this.input.codePointAt(this.pos);
  if (code === undefined) {
    throw new Error(`Read CodePoint Error (pos: ${this.pos})`);
  }
  return code;
};
