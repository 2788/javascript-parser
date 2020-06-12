import { Token } from "./token";

export class Parser {
  input: string;
  line: number = 1;
  col: number = 1;
  pos: number = 0; // 输入流指针
  start: number = 0; // 当前token起始位置
  end: number = 0; // 当前token结束位置
  tokenArr: Token[] = [];
  readToken!: () => void;
  readNumber!: () => void;
  readString!: () => void;
  readName!: () => void;
  readRegexp!: () => void;
  readKeyWords!: () => void;
  readPunctuations!: () => void;
  skipLineComment!: () => void;
  skipBlockComment!: () => void;
  skipSpace!: () => void;
  finishToken!: () => void;
  readOp!: () => void;
  constructor(input: string) {
    this.input = input;
  }
  raise(info: string) {
    info = `${info} (${this.line}:${this.col})`;
    throw new SyntaxError(info);
  }
}
