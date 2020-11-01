import { Parser } from "./../src/parser";
export function parse(source: string) {
  return new Parser(source).parseSource();
}
