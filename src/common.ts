import { Token, SyntaxKind, TokenFlags } from "./types";
import { Parser } from "./parser";
import * as ESTree from "./estree";
import { raise, Errors } from "./errors";
export function expect(p: Parser, expectedTokenType: SyntaxKind) {
  if (p.getCurrentToken().type !== expectedTokenType) {
    p.raise(`expected ${SyntaxKind[expectedTokenType]}`);
  }
  p.readToken();
}

// https://www.ecma-international.org/ecma-262/10.0/index.html#sec-automatic-semicolon-insertion
// 自动插入分号,主要表现为在违规token也就是,此处不符合解析规则的时候,在满足下面条件时候,在此token前面插入一个`;`
// 1.在此token前面有行终结符的时候
// 2.此token是`}`
// 3.此token是EOF
// 4.此token是受限产生式的受限token, PostfixExpression,  ContinueStatement,  BreakStatement,  ReturnStatement,  ThrowStatement
// 然而，上述规则有一个附加的优先条件：如果插入分号后解析结果是空语句，或如果插入分号后它成为 for 语句 头部的两个分号之一，那么不会自动插入分号。
export function consumeSemicolon(p: Parser) {
  // 此函数用在需要分号的地方
  // 如果有分号直接消费掉,否则就是违规Token
  // 违规Token就要判断是不是上面提到的几种情况,都不是则直接报错
  let curToken = p.getCurrentToken();
  if (curToken.type === SyntaxKind.Semicolon) {
    p.readToken();
  } else if (
    curToken.context !== TokenFlags.PrecedingLineBreak &&
    curToken.type !== SyntaxKind.EndOfFile &&
    curToken.type !== SyntaxKind.RightBrace
  ) {
    raise(p, Errors.UnexpectedToken, SyntaxKind[curToken.type]);
  }
}

export function isAssignmentOperator(token: Token) {
  return (
    token.type >= SyntaxKind.Assign && token.type <= SyntaxKind.BitwiseAndAssign
  );
}

export function isBinaryOperatorToken(t: Token) {
  return t.type >= SyntaxKind.Add && t.type <= SyntaxKind.BitwiseXor;
}

export function checkBinaryOperatorRightAssociaticity(t: Token) {
  return isBinaryOperatorToken(t) && t.type === SyntaxKind.Exponentiate;
}

const LHSE: string[] = [
  "Identifier",
  "Literal",
  "BigIntLiteral",
  "RegExpLiteral",
  "ThisExpression",
  "ArrayExpression",
  "ObjectExpression",
  "FunctionExpression",
  "MemberExpression",
  "CallExpression",
  "NewExpression",
  "ArrowFunctionExpression",
  "TemplateLiteral",
  "TaggedTemplateExpression",
  "ClassExpression",
  "MetaProperty",
  // "AwaitExpression;",
];

export function isLHSE(expression: ESTree.Node): boolean {
  return LHSE.indexOf(expression.type) > -1;
}

export function checkReferenceExpression(expression: ESTree.Expression) {
  return (
    expression.type === "Identifier" || expression.type === "MemberExpression"
  );
}

export function createExpressionLocation(
  p: Parser,
  start: Token
): ESTree.SourceLocation {
  let end = p.getCurrentToken();
  return {
    start: start.loc.start,
    end: end.loc.start,
  };
}
