import { Parser } from "./parser";

// 正则表达式字面量可参考 https://github.com/sweet-js/sweet-core/wiki/design
export interface Tokenizer {
  readToken(): void;

  readNumber(): void;

  readString(): void;

  readName(): void;

  readRegexp(): void;

  readKeyWords(): void;

  skipLineComment(): void;

  skipBlockComment(): void;

  skipSpace(): void;

  finishToken(): void;
}

Parser.prototype

//   Parser.prototype.readNumber() {}

//   Parser.prototype.readString() {}

//   Parser.prototype.readName() {}

//   Parser.prototype.readRegexp() {}

//   Parser.prototype.readKeyWords() {}

//   Parser.prototype.readPunctuations() {}

//   Parser.prototype.skipLineComment() {}

//   Parser.prototype.skipBlockComment() {}

//   Parser.prototype.skipSpace() {}

//   Parser.prototype.finishToken() {}
