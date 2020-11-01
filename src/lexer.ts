import {
  nonASCIIwhitespace,
  isIdentifierCode,
  isKeyWords,
  isHexDigit,
  validateExponentPart,
  isLineTerminator,
  identifierStartReg,
  isIdentifierPartCode,
} from "./utils";
import {
  Token,
  SyntaxKind,
  string2SyntaxKind,
  CharacterCodes,
  TokenFlags,
} from "./types";
import { SourceLocation } from "./estree";

// 正则表达式字面量可参考 https://github.com/sweet-js/sweet-core/wiki/design

export class Lexer {
  input: string;
  line: number = 1; // 指针当前行
  col: number = 0; // 指针当前列
  pos: number = 0; // 输入流指针
  startLine: number = 0; // 当前token起始位置
  startCol: number = 0; // 当前token结束位置
  tokenArr: Token[] = [];
  context: TokenFlags = TokenFlags.None;
  readToken!: () => Token | never;
  readIdentifierOrKW!: () => Token | never;
  readNumber!: () => Token | never;
  readString!: () => Token | never;
  reReadDivisionToken!: (preToken: Token) => Token | never;
  readPunctuations!: () => Token | never;
  skipLineComment!: () => void;
  skipBlockComment!: () => void;
  skipSpace!: () => boolean;
  readOp!: () => Token | never;
  fullCodePointAtPos!: (pos?: number) => number;
  readUnicodeEscapeSequence!: () => string | never;
  readHex4Digits!: () => number | never;
  readHexDigits!: () => void;
  readCodePoint!: () => number | never;
  readDecimalLiteral!: () => Token | never;
  readOtherRadixLiteral!: (radix: number) => Token | never;
  readEscapeSequence!: () => string | never;
  getCurrentTokenLoc!: () => SourceLocation;
  constructor(input: string) {
    this.input = input;
  }
  raise(info: string): never {
    info = `${info} at (${this.startLine}, ${this.startCol}) offset`;
    throw new SyntaxError(info);
  }
  createToken(
    type: SyntaxKind,
    loc: SourceLocation,
    value: string | number | RegExp | null = null
  ): Token {
    return new Token(type, loc, value, this.context);
  }
}

Lexer.prototype.readToken = function (): Token | never {
  try {
    let str: string | undefined;
    let context = TokenFlags.None;

    context |= this.skipSpace()
      ? TokenFlags.PrecedingLineBreak
      : TokenFlags.None; // skipSpace返回是否包含了行终结符
    this.context = context;
    this.startLine = this.line;
    this.startCol = this.col;

    while (this.pos < this.input.length) {
      let code = this.fullCodePointAtPos();
      switch (code) {
        case CharacterCodes._0:
        case CharacterCodes._1:
        case CharacterCodes._2:
        case CharacterCodes._3:
        case CharacterCodes._4:
        case CharacterCodes._5:
        case CharacterCodes._6:
        case CharacterCodes._7:
        case CharacterCodes._8:
        case CharacterCodes._9:
          return this.readNumber();

        case CharacterCodes.dot: // .
          if (/\d/.test(this.input[this.pos + 1])) {
            return this.readNumber();
          }
          this.pos++;
          this.col++;

          return this.createToken(SyntaxKind.Period, this.getCurrentTokenLoc());

        case CharacterCodes.singleQuote: // '
        case CharacterCodes.doubleQuote: // "
          return this.readString();

        case CharacterCodes.plus: // +
          str = this.input.slice(this.pos, this.pos + 2);
          if (str === "+=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.AddAssign,
              this.getCurrentTokenLoc()
            );
          } else if (str === "++") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.Increment,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(SyntaxKind.Add, this.getCurrentTokenLoc());

        case CharacterCodes.minus: // -
          str = this.input.slice(this.pos, this.pos + 2);
          if (str === "-=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.SubtractAssign,
              this.getCurrentTokenLoc()
            );
          } else if (str === "--") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.Decrement,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.Subtract,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.asterisk: // *
          str = this.input.slice(this.pos, this.pos + 3);
          if (str === "**=") {
            this.pos += 3;
            this.col += 3;
            return this.createToken(
              SyntaxKind.ExponentiateAssign,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith("**")) {
            //暂时只实现es5
            // this.raise("Unexpected Token")
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.Exponentiate,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.MultiplyAssign,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.slash: // /
          if (this.input[this.pos + 1] === "=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.DivideAssign,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(SyntaxKind.Divide, this.getCurrentTokenLoc());

        case CharacterCodes.percent: // %
          str = this.input.slice(this.pos, this.pos + 2);
          if (str === "%=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.ModuloAssign,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.ModuloAssign,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.equals: // =
          str = this.input.slice(this.pos, this.pos + 3);
          if (str === "===") {
            this.pos += 3;
            this.col += 3;
            return this.createToken(
              SyntaxKind.StrictEqual,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith("==")) {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.LooseEqual,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(SyntaxKind.Assign, this.getCurrentTokenLoc());

        case CharacterCodes.ampersand: // &
          str = this.input.slice(this.pos, this.pos + 2);
          if (str === "&&") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.LogicalAnd,
              this.getCurrentTokenLoc()
            );
          } else if (str === "&=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.BitwiseAndAssign,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.BitwiseAnd,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.bar: // |
          str = this.input.slice(this.pos, this.pos + 2);
          if (str === "||") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.LogicalOr,
              this.getCurrentTokenLoc()
            );
          } else if (str === "|=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.BitwiseOrAssign,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.BitwiseOr,
            this.getCurrentTokenLoc()
          );
        case CharacterCodes.caret: // ^
          str = this.input.slice(this.pos, this.pos + 2);
          if (str === "^=") {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.BitwiseXorAssign,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.BitwiseOr,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.greaterThan: // >
          str = this.input.slice(this.pos, this.pos + 4);
          if (str === ">>>=") {
            this.pos += 4;
            this.col += 4;
            return this.createToken(
              SyntaxKind.LogicalShiftRightAssign,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith(">>>")) {
            this.pos += 3;
            this.col += 3;
            return this.createToken(
              SyntaxKind.LogicalShiftRight,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith(">>=")) {
            this.pos += 3;
            this.col += 3;
            return this.createToken(
              SyntaxKind.ShiftRightAssign,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith(">>")) {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.ShiftRight,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith(">=")) {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.GreaterThanOrEqual,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.GreaterThan,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.lessThan: // <
          str = this.input.slice(this.pos, this.pos + 3);
          if (str === "<<=") {
            this.pos += 3;
            this.col += 3;
            return this.createToken(
              SyntaxKind.ShiftLeftAssign,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith("<<")) {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.LogicalShiftRight,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith("<=")) {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.LessThanOrEqual,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.LessThan,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.exclamation: // !
          str = this.input.slice(this.pos, this.pos + 3);
          if (str === "!==") {
            this.pos += 3;
            this.col += 3;
            return this.createToken(
              SyntaxKind.StrictNotEqual,
              this.getCurrentTokenLoc()
            );
          } else if (str.startsWith("!=")) {
            this.pos += 2;
            this.col += 2;
            return this.createToken(
              SyntaxKind.LooseNotEqual,
              this.getCurrentTokenLoc()
            );
          }
          this.pos++;
          this.col++;
          return this.createToken(SyntaxKind.Negate, this.getCurrentTokenLoc());

        case CharacterCodes.tilde: // ~
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.Complement,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.openParen: // (
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.LeftParen,
            this.getCurrentTokenLoc()
          );
        case CharacterCodes.closeParen: // )
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.RightParen,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.openBrace: // {
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.LeftBrace,
            this.getCurrentTokenLoc()
          );
        case CharacterCodes.closeBrace: // }
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.RightBrace,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.openBracket: // [
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.LeftBracket,
            this.getCurrentTokenLoc()
          );
        case CharacterCodes.closeBracket: // ]
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.RightBracket,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.semicolon: // ;
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.Semicolon,
            this.getCurrentTokenLoc()
          );

        case CharacterCodes.colon: // :
          this.pos++;
          this.col++;
          return this.createToken(SyntaxKind.Colon, this.getCurrentTokenLoc());

        case CharacterCodes.comma: // ,
          this.pos++;
          this.col++;
          return this.createToken(SyntaxKind.Comma, this.getCurrentTokenLoc());

        case CharacterCodes.question: // ?
          this.pos++;
          this.col++;
          return this.createToken(
            SyntaxKind.QuestionMark,
            this.getCurrentTokenLoc()
          );

        default:
          if (isIdentifierCode(code)) {
            return this.readIdentifierOrKW();
          }
          this.raise("Invalid or unexpected token");
      }
    }
    return this.createToken(SyntaxKind.EndOfFile, this.getCurrentTokenLoc());
  } catch (error) {
    // 为了解决fullCodePoint在读取超过EOF位置时的错误, 粗暴方法
    if (error.message.includes("Read CodePoint"))
      return this.raise("Invalid or unexpected token");
    else throw error;
  }
};

// 读取Number, 进入这个分支可以确定是在Number上下文了
Lexer.prototype.readNumber = function (): Token | never {
  let ch = this.input[this.pos];
  let lookhead = this.input[this.pos + 1];
  // DecimalLiteral 在非'0'开头,则肯定是十进制, 或者`0.`开始
  if (ch !== "0" || (ch === "0" && lookhead === ".")) {
    return this.readDecimalLiteral();
  } else if (ch === "0") {
    switch (lookhead) {
      case "b":
      case "B":
        return this.readOtherRadixLiteral(2);
      case "o":
      case "O":
        return this.readOtherRadixLiteral(8);
      case "x":
      case "X":
        return this.readOtherRadixLiteral(16);
      default:
        return this.readDecimalLiteral();
    }
  }
  return this.raise("Invalid or unexpected token");
};

// 读取字符串, 就是将字符串组成的字符的几种形式分别判断一下
// 一种就是普通的字符构成
// 第二种是LineContinuation, https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminatorSequence
// 第三种是转移字符 https://www.ecma-international.org/ecma-262/10.0/index.html#prod-EscapeSequence
Lexer.prototype.readString = function (): Token | never {
  let val = "";
  let startChar = this.input[this.pos++];
  let normalCharReg =
    startChar === "'" ? /[^'\u000A\u000D]/ : /[^"\u000A\u000D]/;
  while (this.pos < this.input.length) {
    let code = this.fullCodePointAtPos();
    if (
      code === CharacterCodes.backslash &&
      isLineTerminator(this.fullCodePointAtPos(this.pos + 1))
    ) {
      if (
        this.fullCodePointAtPos(this.pos + 1) ===
          CharacterCodes.carriageReturn &&
        this.fullCodePointAtPos(this.pos + 2) === CharacterCodes.lineFeed
      ) {
        this.pos += 3; // \ <CR> <LF>
      } else {
        this.pos += 2; // \ <CR>
      }

      this.col = 0; // 重置列数
      this.line++;
    } else if (code === CharacterCodes.backslash) {
      this.pos++;
      this.col++;
      val += this.readEscapeSequence();
    } else if (normalCharReg.test(String.fromCodePoint(code))) {
      let offset = code > 0xffff ? 2 : 1;
      this.pos += offset;
      this.col += offset;
      val += String.fromCodePoint(code);
    } else {
      break;
    }
  }
  // 判断结束时 符号是不是和开始符号相同 不相同就报错
  if (this.input[this.pos] !== startChar) {
    return this.raise("Invalid or unexpected token");
  }
  this.pos++;
  return this.createToken(
    SyntaxKind.StringLiteral,
    this.getCurrentTokenLoc(),
    val
  );
};

Lexer.prototype.readEscapeSequence = function (): string | never {
  switch (this.input[this.pos]) {
    case "x":
      // HexEscapeSequence => https://www.ecma-international.org/ecma-262/10.0/index.html#prod-HexEscapeSequence
      if (
        isHexDigit(this.input[this.pos + 1]) &&
        isHexDigit(this.input[this.pos + 2])
      ) {
        this.context |= TokenFlags.HexSpecifier;
        this.pos += 3;
        this.col += 3;
        return String.fromCodePoint(
          parseInt(this.input.slice(this.pos - 2, this.pos), 16)
        );
      }
      return this.raise("Invalid hexadecimal escape sequence");
    case "u":
      return this.readUnicodeEscapeSequence();

    // LegacyOctalEscapeSequence => https://www.ecma-international.org/ecma-262/10.0/index.html#prod-annexB-LegacyOctalEscapeSequence
    case "0":
    case "1":
    case "2":
    case "3":
      this.context |= TokenFlags.Octal;
      if (
        this.fullCodePointAtPos(this.pos + 1) > CharacterCodes._7 ||
        this.fullCodePointAtPos(this.pos + 1) < CharacterCodes._0
      ) {
        this.pos++;
        this.col++;
        return String.fromCodePoint(parseInt(this.input[this.pos - 1]));
      }

      this.pos += 2;
      this.col += 2;

      if (
        this.fullCodePointAtPos(this.pos) > CharacterCodes._7 ||
        this.fullCodePointAtPos(this.pos) < CharacterCodes._0
      ) {
        return String.fromCodePoint(
          parseInt(this.input.slice(this.pos - 2, this.pos))
        );
        // return this.raise("Octal escape sequences are not allowed");
      }
      this.pos++;
      this.col++;
      return String.fromCodePoint(
        parseInt(this.input.slice(this.pos - 3, this.pos))
      );

    case "4":
    case "5":
    case "6":
    case "7":
      this.context |= TokenFlags.Octal;
      if (
        this.fullCodePointAtPos(this.pos + 1) > CharacterCodes._7 ||
        this.fullCodePointAtPos(this.pos + 1) < CharacterCodes._0
      ) {
        this.pos++;
        this.col++;
        return String.fromCodePoint(parseInt(this.input[this.pos - 1]));
      }
      this.pos += 2;
      this.col += 2;
      return String.fromCodePoint(
        parseInt(this.input.slice(this.pos - 2, this.pos))
      );

    case "'":
    case '"':
    case "b":
    case "f":
    case "n":
    case "r":
    case "t":
    case "v":
      this.pos++;
      this.col++;
      return EscapeCharMap[this.input[this.pos - 1]];
  }
  this.col++;
  return this.input[++this.pos];
};

Lexer.prototype.readIdentifierOrKW = function (): Token | never {
  let escape = false;
  let first = true;
  let name: string = "";
  while (this.pos < this.input.length) {
    let code = this.fullCodePointAtPos();
    if (
      (first && identifierStartReg.test(String.fromCodePoint(code))) ||
      isIdentifierCode(code)
    ) {
      let offset = code > 0xffff ? 2 : 1;
      this.pos += offset;
      this.col += offset;
      name += String.fromCodePoint(code);
    } else if (code == 92) {
      // '\'
      escape = true;
      this.pos++;
      this.col++;
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
    return this.createToken(
      string2SyntaxKind[name],
      this.getCurrentTokenLoc(),
      name
    );
  } else {
    return this.createToken(
      SyntaxKind.Identifier,
      this.getCurrentTokenLoc(),
      name
    );
  }
};

// 只有在之前读取为 '/' 或者 '/=' 才读取正则字面量
Lexer.prototype.reReadDivisionToken = function (
  preToken: Token
): Token | never {
  if (
    preToken.type != SyntaxKind.Divide &&
    preToken.type != SyntaxKind.DivideAssign
  ) {
    return preToken;
  }
  let patternStart =
    preToken.type == SyntaxKind.Divide ? this.pos : this.pos - 1;
  let inCharacterClass = false;
  while (true) {
    // 如果是EOF或者遇到了行终结符就报 unterminated regular expression 错误
    if (this.pos >= this.input.length) {
      this.raise("unterminated regular expression");
    }
    const code = this.fullCodePointAtPos();
    if (isLineTerminator(code)) {
      this.raise("unterminated regular expression");
    }

    if (code === CharacterCodes.slash && !inCharacterClass) {
      // 由于 `/` 是可以在正则里面出现的,但是要在分类里面,比如 reg = /[/]/
      // 如果是 `/` 并且不是在字符类别里面就证明到了正则表达式的结束位置了
      this.pos++;
      this.col++;
      break;
    } else if (code === CharacterCodes.openBracket) {
      // `[`
      inCharacterClass = true;
    } else if (code === CharacterCodes.closeBracket) {
      // `]`
      inCharacterClass = false;
    }
    this.col++;
    this.pos++;
  }
  let pattern = this.input.slice(patternStart, this.pos - 1);

  let flagStart = this.pos;
  while (
    this.pos < this.input.length &&
    isIdentifierPartCode(this.fullCodePointAtPos())
  ) {
    this.pos++;
    this.col++;
  }
  let flag = this.input.slice(flagStart, this.pos);

  let reg;
  try {
    reg = RegExp(pattern, flag);
  } catch (error) {
    this.raise(error.message);
  }

  return this.createToken(
    SyntaxKind.RegularExpressionLiteral,
    this.getCurrentTokenLoc(),
    reg
  );
};

Lexer.prototype.readPunctuations = function (): Token | never {
  throw new Error();
};

Lexer.prototype.readOp = function (): Token | never {
  throw new Error();
};

Lexer.prototype.readUnicodeEscapeSequence = function (): string | never {
  if (this.input[this.pos] == "u") {
    this.pos++;
    this.col++;
    if (this.input[this.pos] == "{") {
      this.pos++;
      this.col++;
      let escapeChar = String.fromCodePoint(this.readCodePoint());
      return this.input[this.pos] == "}" ? escapeChar : "";
    } else {
      return String.fromCodePoint(this.readHex4Digits());
    }
  } else {
    return this.raise("Expecting Unicode escape sequence");
  }
};

Lexer.prototype.readHex4Digits = function (): number | never {
  let count = 0;
  let start = this.pos;
  while (isHexDigit(this.input[this.pos]) && count < 4) {
    this.pos++;
    this.col++;
    count++;
  }
  if (count !== 4) {
    this.raise("Expected 4 HexDigits");
  }
  return Number.parseInt(this.input.slice(start, this.pos), 16);
};

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-CodePoint
Lexer.prototype.readCodePoint = function (): number | never {
  let start = this.pos;
  while (isHexDigit(this.input[this.pos])) {
    this.pos++;
    this.col++;
  }
  let codePoint = Number.parseInt(this.input.slice(start, this.pos), 16);
  if (codePoint > 0x10ffff) {
    return codePoint;
  } else {
    return this.raise("CodePoint must less than 0x10ffff");
  }
};

Lexer.prototype.readDecimalLiteral = function (): Token | never {
  let integerStart = this.pos;
  let integerPart: string = "",
    decimalPart: string = "",
    exponentPart: string | undefined = undefined;
  while (/\d/.test(this.input[this.pos])) {
    this.pos++;
    this.col++;
  }
  integerPart = this.input.slice(integerStart, this.pos);
  if (this.input[this.pos] === ".") {
    this.pos ++;
    this.col ++;
    let decimalPartStart = this.pos;
    while (/\d/.test(this.input[this.pos])) {
      this.pos++;
      this.col++;
    }
    decimalPart = this.input.slice(decimalPartStart, this.pos);
  }
  if (this.input[this.pos] === "e" || this.input[this.pos] === "E") {
    this.pos++;
    this.col++;
    let exponentPartStart = this.pos;
    while (/\d/.test(this.input[this.pos])) {
      this.pos++;
      this.col++;
    }
    exponentPart = this.input.slice(exponentPartStart, this.pos);
  }
  if (
    (validateExponentPart(exponentPart) && integerPart.length > 0) ||
    (integerPart === "" && decimalPart.length > 0)
  ) {
    return this.createToken(
      SyntaxKind.NumericLiteral,
      this.getCurrentTokenLoc(),
      parseFloat(
        `${integerPart}.${decimalPart}${
          exponentPart?.length ? "e" + exponentPart : ""
        }`
      )
    );
  } else {
    return this.raise("Invalid or unexpected token");
  }
};

Lexer.prototype.readOtherRadixLiteral = function (
  radix: number
): Token | never {
  this.pos += 2;
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
  while (this.pos < this.input.length && reg.test(this.input[this.pos])) {
    this.pos++;
    this.col++;
  }
  let literal = this.input.slice(start, this.pos);
  if (literal.length) {
    return this.createToken(
      SyntaxKind.NumericLiteral,
      this.getCurrentTokenLoc(),
      parseInt(literal, radix)
    );
  } else {
    return this.raise("Invalid or unexpected token");
  }
};

Lexer.prototype.skipLineComment = function () {
  let ch = this.input[this.pos];
  while (this.pos < this.input.length && !isLineTerminator(ch)) {
    this.pos++;
    this.col++;
    ch = this.input[this.pos];
  }
  if (this.pos >= this.input.length) return;
  if (
    this.fullCodePointAtPos() === CharacterCodes.carriageReturn &&
    this.fullCodePointAtPos(this.pos + 1) === CharacterCodes.lineFeed
  ) {
    this.pos += 2;
  } else {
    this.pos++;
  }
  this.line++;
  this.col = 0;
};

Lexer.prototype.skipBlockComment = function () {
  while (this.pos < this.input.length) {
    if (
      isLineTerminator(this.fullCodePointAtPos()) &&
      this.fullCodePointAtPos(this.pos - 1) !== CharacterCodes.carriageReturn
    ) {
      this.line++;
      this.col = 0;
    }
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
Lexer.prototype.skipSpace = function (): boolean {
  let hasPrecedingLineBreak = false;
  while (this.pos < this.input.length) {
    let code = this.fullCodePointAtPos();
    switch (code) {
      // 空白符号
      case CharacterCodes.space: // <SP>
      case CharacterCodes.nonBreakingSpace: // <NBSP>
        ++this.pos;
        this.col++;
        break;

      // 换行
      // 处理\r\n情况
      // @ts-ignore
      case CharacterCodes.carriageReturn: // <CR>
        if (this.fullCodePointAtPos(this.pos + 1) == 10) {
          // /r/n情况
          this.pos++;
        }

      case CharacterCodes.lineFeed: // <LF>
      case CharacterCodes.lineSeparator: // <LS>
      case CharacterCodes.paragraphSeparator: // <PS>
        hasPrecedingLineBreak = true;
        this.pos++;
        this.line++;
        this.col = 0;
        break;

      case CharacterCodes.slash: // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
          case CharacterCodes.asterisk: // '*'
            this.skipBlockComment();
            break;
          case CharacterCodes.slash:
            this.skipLineComment();
            break;
          default:
            return hasPrecedingLineBreak; // 结束函数
        }
        break;

      default:
        // 9-13码点 或者 <USP>码点类别
        if (
          (code > 8 && code < 14) ||
          nonASCIIwhitespace.test(String.fromCodePoint(code))
        ) {
          ++this.pos;
          this.col++;
        } else {
          return hasPrecedingLineBreak; // 结束函数
        }
    }
  }
  return hasPrecedingLineBreak;
};

Lexer.prototype.fullCodePointAtPos = function (pos?: number): number {
  let code = this.input.codePointAt(pos === undefined ? this.pos : pos);
  if (code === undefined) {
    throw new Error(`Read CodePoint Error (pos: ${this.pos})`);
  }
  return code;
};

Lexer.prototype.getCurrentTokenLoc = function (): SourceLocation {
  return {
    start: {
      line: this.startLine,
      column: this.col,
    },
    end: {
      line: this.line,
      column: this.col,
    },
  };
};

const EscapeCharMap: {
  [name: string]: string;
} = {
  "'": "'",
  '"': '"',
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
  v: "\v",
};
