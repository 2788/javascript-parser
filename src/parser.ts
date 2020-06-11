import { Token } from "./token";
import { Tokenizer } from "./lexer";

interface ParserProperty {
  input: string;
  line: number;
  col: number;
  tokenArr: Token[];
  hello?():void;
}

type Composite = ParserProperty & Partial<Tokenizer>;
export class Parser implements Composite {
  input: string;
  line: number = 1;
  col: number = 1;
  tokenArr: Token[] = [];
  constructor(input: string) {
    this.input = input;
  }
  hello?():void;
}

Parser.prototype.hello = function(){}

