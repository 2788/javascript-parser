import { Lexer } from "./lexer";
import * as ESTree from "./estree";
import { parseStatementList } from "./statement";
import { Token, ParseContext } from "./types";

export class Parser {
  private lexer: Lexer;
  private currentToken: Token | null = null;
  private context: ParseContext = ParseContext.None;
  private labelSet: string[] = [];
  constructor(sourceCode: string) {
    this.lexer = new Lexer(sourceCode);
  }

  parseSource(): ESTree.Program {
    this.readToken();
    let body = parseStatementList(this);
    const node: ESTree.Program = {
      type: "Program",
      sourceType: "script",
      body,
    };
    return node;
  }

  readToken(): Token {
    return this.currentToken = this.lexer.readToken();
  }

  setParseContext(context: number) {
    this.context = context;
  }

  getParseContext() {
    return this.context;
  }

  enableParseContext(context: ParseContext) {
    this.context |= context;
  }

  disableParseContext(context: ParseContext) {
    this.context &= ~context;
  }

  add2LabelSet(label: string) {
    this.labelSet.push(label);
  }
  popLabelSet(){
    this.labelSet.pop();
  }
  setLabelSet(labelSet: string[]) {
    this.labelSet = labelSet;
  }
  getLabelSet() {
    return this.labelSet;
  }

  getCurrentToken(): Token | never {
    if (this.currentToken === null) {
      throw new Error("not read token yet");
    }
    return this.currentToken;
  }
  reReadDivisionToken(): Token {
    return this.currentToken = this.lexer.reReadDivisionToken(this.getCurrentToken());
  }
  raise(info: string): never {
    return this.lexer.raise(info);
  }
}
