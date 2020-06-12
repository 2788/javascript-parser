import { Parser } from "./parser";
import { isNewLineChar, nonASCIIwhitespace } from "./utils";

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

Parser.prototype.readNumber = function () {
    
};

Parser.prototype.readString = function () {};

Parser.prototype.readName = function () {};

Parser.prototype.readRegexp = function () {};

Parser.prototype.readKeyWords = function () {};

Parser.prototype.readPunctuations = function () {};

Parser.prototype.readOp = function () {};

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
        if ((ch > 8 && ch < 14) || nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          return; // 结束函数
        }
    }
  }
};

Parser.prototype.finishToken = function () {};


