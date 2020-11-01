import { Parser } from "./parser";
import * as ESTree from "./estree";
import {
  consumeSemicolon,
  createExpressionLocation,
  expect,
  isLHSE,
} from "./common";
import { ParseContext, SyntaxKind, TokenFlags } from "./types";
import {
  
  parseExpression,
  parseIdentifier,
} from "./expression";
import { Errors, raise } from "./errors";
import {
  parseFunctionDeclaration,
  parseVariableDeclarator,
} from "./declaration";
//es6+
// function parseAsyncfunctionOrExpressionStatement() {}
// function parseDirective() {}

// export function parseLetOrExpressionStatement(p: Parser) {}

//es5
export function parseStatementList(
  p: Parser,
  inBlockStatment: boolean = false,
  inSwitchCaseStatment: boolean = false
): ESTree.Statement[] {
  let list = [];
  let curToken = p.getCurrentToken();
  while (
    curToken.type !== SyntaxKind.EndOfFile &&
    // 不在block里面或者token不为`}`时可以继续 解决在解析类似`StatementList }` 时遇到 `}` 直接返回的问题
    (!inBlockStatment || curToken.type !== SyntaxKind.RightBrace) &&
    // 如果在switch里面 case 和 default 会直接停止解析StatementList
    (!inSwitchCaseStatment ||
      (curToken.type !== SyntaxKind.CaseKeyword &&
        curToken.type !== SyntaxKind.DefaultKeyword))
  ) {
    list.push(parseStatementListItem(p));
    curToken = p.getCurrentToken();
  }
  return list;
}
export function parseStatement(p: Parser): ESTree.Statement {
  let curToken = p.getCurrentToken();
  switch (curToken.type) {
    case SyntaxKind.LeftBrace:
      return parseBlockStatement(p);
    case SyntaxKind.VarKeyword:
      return parseVariableStatement(p);
    case SyntaxKind.Semicolon:
      return parseEmptyStatement(p);
    case SyntaxKind.IfKeyword:
      return parseIfStatement(p);
    // IterationStatement
    case SyntaxKind.WhileKeyword:
      return parseWhileStatement(p);
    case SyntaxKind.DoKeyword:
      return parseDoWhileStatement(p);
    case SyntaxKind.ForKeyword:
      return parseForStatement(p);
    case SyntaxKind.ContinueKeyword:
      return parseContinueStatementOrBreakStatement(p, "Continue");
    case SyntaxKind.BreakKeyword:
      return parseContinueStatementOrBreakStatement(p, "Break");
    case SyntaxKind.ReturnKeyword:
      return parseReturnStatement(p);
    case SyntaxKind.WithKeyword:
      return parseWithStatement(p);
    case SyntaxKind.Identifier:
      return parseLabelledStatementOrExpressionStatement(p);
    case SyntaxKind.SwitchKeyword:
      return parseSwitchStatement(p);
    case SyntaxKind.ThrowKeyword:
      return parseThrowStatement(p);
    case SyntaxKind.TryKeyword:
      return parseTryStatement(p);
    case SyntaxKind.DebuggerKeyword:
      return parseDebuggerStatement(p);
    default:
      return parseLabelledStatementOrExpressionStatement(p);
  }
}
export function parseStatementListItem(
  p: Parser
): ESTree.Statement | ESTree.FunctionDeclaration {
  if (p.getCurrentToken().type === SyntaxKind.FunctionKeyword) {
    return parseFunctionDeclaration(p);
  }
  return parseStatement(p);
}

// export function parseExpressionStatement(
//   p: Parser
// ): ESTree.ExpressionStatement {
//   let startToken = p.getCurrentToken();

//   let expression = parseExpression(p);
//   consumeSemicolon(p);
//   return {
//     type: "ExpressionStatement",
//     expression,
//     loc: createExpressionLocation(p, startToken),
//   };
// }

export function parseBlockStatement(p: Parser): ESTree.BlockStatement {
  expect(p, SyntaxKind.LeftBrace);
  let result = parseStatementList(p, true);
  expect(p, SyntaxKind.RightBrace);
  return { type: "BlockStatement", body: result };
}
export function parseEmptyStatement(p: Parser): ESTree.EmptyStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.Semicolon);
  return {
    type: "EmptyStatement",
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseThrowStatement(p: Parser): ESTree.ThrowStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.ThrowKeyword);
  if ((p.getCurrentToken().context & TokenFlags.PrecedingLineBreak) !== 0) {
    raise(p, Errors.NewlineAfterThrow);
  }
  let argument = parseExpression(p);
  consumeSemicolon(p);
  return {
    type: "ThrowStatement",
    argument,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseIfStatement(p: Parser): ESTree.IfStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.IfKeyword);
  expect(p, SyntaxKind.LeftParen);
  let test = parseExpression(p);
  expect(p, SyntaxKind.RightParen);
  let consequent = parseStatement(p);
  let alternate = null;
  if (p.getCurrentToken().type == SyntaxKind.ElseKeyword) {
    p.readToken();
    alternate = parseStatement(p);
  }
  return {
    type: "IfStatement",
    test,
    consequent,
    alternate,
    loc: createExpressionLocation(p, startToken),
  };
}
// export function parseConsequentOrAlternate(p: Parser) {}
export function parseSwitchStatement(p: Parser): ESTree.SwitchStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.SwitchKeyword);
  p.enableParseContext(ParseContext.InSwitchStatement);
  expect(p, SyntaxKind.LeftParen);
  let discriminant = parseExpression(p);
  expect(p, SyntaxKind.RightParen);
  let cases = parseCaseBlock(p);
  p.disableParseContext(ParseContext.InSwitchStatement);
  return {
    type: "SwitchStatement",
    discriminant,
    cases,
    loc: createExpressionLocation(p, startToken),
  };
}
function parseCaseBlock(p: Parser): ESTree.SwitchCase[] {
  expect(p, SyntaxKind.LeftBrace);
  let cases = [];
  while (p.getCurrentToken().type === SyntaxKind.CaseKeyword) {
    cases.push(parseCaseClause(p, SyntaxKind.CaseKeyword));
  }
  if (p.getCurrentToken().type === SyntaxKind.DefaultKeyword) {
    cases.push(parseCaseClause(p, SyntaxKind.DefaultKeyword));
  }
  while (p.getCurrentToken().type === SyntaxKind.CaseKeyword) {
    cases.push(parseCaseClause(p, SyntaxKind.CaseKeyword));
  }
  expect(p, SyntaxKind.RightBrace);
  return cases;
}

function parseCaseClause(
  p: Parser,
  expectedTokenType: SyntaxKind
): ESTree.SwitchCase {
  let startToken = p.getCurrentToken();
  expect(p, expectedTokenType);
  let test = null;
  if (expectedTokenType === SyntaxKind.CaseKeyword) test = parseExpression(p);
  expect(p, SyntaxKind.Colon);
  let consequent = parseStatementList(p, true, true);
  return {
    type: "SwitchCase",
    test,
    consequent,
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseReturnStatement(p: Parser): ESTree.ReturnStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.ReturnKeyword);
  let argument = null;
  let curToken = p.getCurrentToken();
  if (
    (curToken.context & TokenFlags.PrecedingLineBreak) === 0 &&
    curToken.type !== SyntaxKind.Semicolon
  )
    argument = parseExpression(p);

  consumeSemicolon(p);
  return {
    type: "ReturnStatement",
    argument,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseWhileStatement(p: Parser): ESTree.WhileStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.WhileKeyword);
  expect(p, SyntaxKind.LeftParen);
  let test = parseExpression(p);
  expect(p, SyntaxKind.RightParen);
  let body = parseStatement(p);
  return {
    type: "WhileStatement",
    test,
    body,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseContinueStatementOrBreakStatement(
  p: Parser,
  statementType: "Break" | "Continue"
): ESTree.ContinueStatement | ESTree.BreakStatement {
  let startToken = p.getCurrentToken();
  expect(
    p,
    statementType === "Break"
      ? SyntaxKind.BreakKeyword
      : SyntaxKind.ContinueKeyword
  );
  let context = p.getParseContext();
  let isInSwitchState = context & ParseContext.InSwitchStatement;
  let isInIterationStatement = context & ParseContext.InIterationStatement;
  // 判断是否在迭代语句或者switch语句
  if (
    statementType === "Break" &&
    !isInIterationStatement &&
    !isInSwitchState
  ) {
    raise(p, Errors.IllegalBreak);
  }
  // continue 只能在iteration语句里面
  if (
    statementType === "Continue" &&
    !isInIterationStatement 
  ) {
    raise(p, Errors.IllegalContinue);
  }

  let label = null;
  let curToken = p.getCurrentToken();
  if (
    (curToken.context & TokenFlags.PrecedingLineBreak) === 0 &&
    curToken.type !== SyntaxKind.Semicolon
  )
    label = parseIdentifier(p);
  // 检测label的是否存在
  if (label !== null && !p.getLabelSet().includes(label.name))
    raise(p, Errors.UndefinedLabel, label.name);

  consumeSemicolon(p);
  return {
    type: statementType === "Continue" ? "ContinueStatement" : "BreakStatement",
    label,
    loc: createExpressionLocation(p, startToken),
  };
}

// @ts-ignore deprecated
function parseBreakStatement(p: Parser) {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.ContinueKeyword);
  let context = p.getParseContext();
  // 判断是否在迭代语句或者switch语句
  if (
    (context & ParseContext.InIterationStatement) !== 0 &&
    (context & ParseContext.InSwitchStatement) !== 0
  ) {
    raise(p, Errors.IllegalBreak);
  }
  let label = null;
  let curToken = p.getCurrentToken();
  if (
    (curToken.context & TokenFlags.PrecedingLineBreak) === 0 &&
    curToken.type !== SyntaxKind.Semicolon
  )
    label = parseIdentifier(p);
  // 检测label的是否存在
  if (label !== null && !p.getLabelSet().includes(label.name))
    raise(p, Errors.UndefinedLabel, label.name);

  consumeSemicolon(p);
  return {
    type: "ContinueStatement",
    label,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseWithStatement(p: Parser): ESTree.WithStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.WithKeyword);
  expect(p, SyntaxKind.LeftParen);
  let object = parseExpression(p);
  expect(p, SyntaxKind.RightParen);
  let body = parseStatement(p);
  return {
    type: "WithStatement",
    object,
    body,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseDebuggerStatement(p: Parser): ESTree.DebuggerStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.DebuggerKeyword);
  consumeSemicolon(p);
  return {
    type: "DebuggerStatement",
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseTryStatement(p: Parser): ESTree.TryStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.TryKeyword);
  let block = parseBlockStatement(p);
  let handler = null,
    finalizer = null;
  if (p.getCurrentToken().type === SyntaxKind.CatchKeyword) {
    handler = parseCatchBlock(p);
  }
  if (p.getCurrentToken().type === SyntaxKind.FinallyKeyword) {
    finalizer = parseBlockStatement(p);
  }
  return {
    type: "TryStatement",
    block,
    handler,
    finalizer,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseCatchBlock(p: Parser): ESTree.CatchClause {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.CatchKeyword);
  expect(p, SyntaxKind.LeftParen);
  let param = parseIdentifier(p);
  expect(p, SyntaxKind.RightParen);
  let body = parseBlockStatement(p);
  return {
    type: "CatchClause",
    param,
    body,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseDoWhileStatement(p: Parser): ESTree.DoWhileStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.DoKeyword);
  p.enableParseContext(ParseContext.InIterationStatement);
  let body = parseStatement(p);
  expect(p, SyntaxKind.WhileKeyword);
  expect(p, SyntaxKind.LeftParen);
  let test = parseExpression(p);
  expect(p, SyntaxKind.RightParen);
  p.disableParseContext(ParseContext.InIterationStatement);
  consumeSemicolon(p);
  return {
    type: "DoWhileStatement",
    test,
    body,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseForStatement(
  p: Parser
): ESTree.ForStatement | ESTree.ForInStatement {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.ForKeyword);
  expect(p, SyntaxKind.LeftParen);
  p.enableParseContext(ParseContext.DisallowInContext);
  let tmp:
    | ESTree.Expression
    | ESTree.VariableDeclaration
    | ESTree.EmptyStatement;
  if (p.getCurrentToken().type === SyntaxKind.VarKeyword) {
    // 不能直接使用 parseVariableStatement,  VariableStatement 会消费掉`;`符号
    p.readToken();
   tmp = {
     type:"VariableDeclaration",
     declarations: parseVariableDeclarationList(p), 
     kind:"var",
     loc:createExpressionLocation(p, startToken)
   };
  } else if (p.getCurrentToken().type === SyntaxKind.Semicolon)
    tmp = { type: "EmptyStatement" };
  else tmp = parseExpression(p);
  p.disableParseContext(ParseContext.DisallowInContext);

  if (p.getCurrentToken().type === SyntaxKind.InKeyword) {
    if (!isLHSE(tmp) && tmp.type !== "VariableDeclaration") {
      raise(p, Errors.InvalidLHSInForLoop);
    }
    if (tmp.type === "VariableDeclaration" && tmp.declarations.length > 1) {
      raise(p, Errors.ForInOfLoopMultiBindings, "in");
    }
    p.readToken();
    let right = parseExpression(p);
    expect(p, SyntaxKind.RightParen);
    let body = parseStatement(p);
    return {
      type: "ForInStatement",
      left: tmp as ESTree.Expression,
      right,
      body,
      loc: createExpressionLocation(p, startToken),
    };
  } else if (p.getCurrentToken().type === SyntaxKind.Semicolon) {
    expect(p, SyntaxKind.Semicolon);
    let test = null;
    if (p.getCurrentToken().type !== SyntaxKind.Semicolon)
      test = parseExpression(p);
    expect(p, SyntaxKind.Semicolon);
    let update = null;
    if (p.getCurrentToken().type !== SyntaxKind.RightParen)
      update = parseExpression(p);
    expect(p, SyntaxKind.RightParen);
    let body = parseStatement(p);
    let init = null;
    if (tmp.type !== "EmptyStatement") {
      init = tmp;
    }
    return {
      type: "ForStatement",
      init,
      test,
      update,
      body,
      loc: createExpressionLocation(p, startToken),
    };
  } else {
    raise(p, Errors.Unexpected);
  }
}
export function parseLabelledStatementOrExpressionStatement(
  p: Parser
): ESTree.ExpressionStatement | ESTree.LabeledStatement {
  let startToken = p.getCurrentToken();
  let expression = parseExpression(p);
  if (
    expression.type !== "Identifier" ||
    p.getCurrentToken().type !== SyntaxKind.Colon
  ) {
    consumeSemicolon(p);
    return {
      type: "ExpressionStatement",
      expression,
      loc: createExpressionLocation(p, startToken),
    };
  }

  // 只有在 Identifier : Statement 情况下才符合LabelledStatement

  p.readToken(); // 消费掉 Colon
  // 如果已经存在label
  if (p.getLabelSet().includes(startToken.value as string)) {
    raise(p, Errors.LabelRedeclaration, startToken.value as string);
  }
  p.add2LabelSet(startToken.value as string);
  let body = parseStatement(p);
  p.popLabelSet();
  return {
    type: "LabeledStatement",
    label: { name: startToken.value as string, type: "Identifier" },
    body,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseVariableStatement(p: Parser): ESTree.VariableDeclaration {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.VarKeyword);
  let declarations = parseVariableDeclarationList(p);
  consumeSemicolon(p);
  return {
    type: "VariableDeclaration",
    declarations,
    kind: "var",
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseVariableDeclarationList(
  p: Parser
): ESTree.VariableDeclarator[] {
  let declarations = [];
  while (true) {
    declarations.push(parseVariableDeclarator(p));
    if (p.getCurrentToken().type !== SyntaxKind.Comma) {
      break;
    } else {
      p.readToken();
    }
  }
  return declarations;
}
