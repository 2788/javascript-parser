import { Parser } from "./parser";
import {
  SyntaxKind,
  token2String,
  ParseContext,
  Token,
  TokenFlags,
} from "./types";
import * as ESTree from "./estree";
import {
  isAssignmentOperator,
  expect,
  consumeSemicolon,
  isBinaryOperatorToken,
  createExpressionLocation,
  isLHSE,
  checkReferenceExpression,
  checkBinaryOperatorRightAssociaticity,
} from "./common";
import { raise, Errors } from "./errors";
import { parseStatementList } from "./statement";
// es6+
// export function parseRestElement() {}
// export function parseYieldExpression() {}
// export function parseAwaitExpression() {}
// export function parseImportExpression() {}
// export function parseSuperExpression() {}
// export function parseCallImportOrMetaProperty() {}
// export function parseTemplateLiteral() {}
// export function parseTemplateSpans() {}
// export function parseTemplate() {}
// export function parseTemplateTail() {}
// export function parseSpreadElement() {}
// /**
//  *
//  * [Link](https://github.com/estree/estree/blob/70d58d73f69a3a72b51ed3fb540fae2550160619/es2015.md#metaproperty)
//  *
//  * MetaProperty node represents new.target meta property in ES2015. In the future, it will represent other meta properties as well.
//  */
// export function parseMetaProperty() {}
// export function parseAsyncArgument() {}
// export function parseAndClassifyIdentifier() {}
// export function parseBigIntLiteral() {}
// export function parseArrowfunctionExpression() {}
// export function parseClassExpression() {}
// export function parseClassBodyAndElementList() {}
// export function parseClassElementList() {}
// /**
//  * using in class declaration
//  */
// export function parseMethodDeclaration() {}
// /**
//  * experimental syntax
//  *
//  * do '{' StatementList '}'
//  */
// export function parseDoExpression() {}
// /**
//  * Parse identifier name or private name (stage 3 proposal)
//  */
// export function parseIdentifierNameOrPrivateName() {}
// /**
//  *  ComputedPropertyName[Yield, Await]:
//  *
//  *      [AssignmentExpression[+In, ?Yield, ?Await]]
//  */
// export function parseComputedPropertyName() {}

// es5
export function parsePrimaryExpression(p: Parser): any | never {
  const token = p.getCurrentToken();
  switch (token.type) {
    case SyntaxKind.ThisKeyword:
      return parseThisExpression(p);
    case SyntaxKind.Identifier:
      return parseIdentifier(p);
    case SyntaxKind.NumericLiteral:
      return parseLiteral(p, p.getCurrentToken().value as number);
    case SyntaxKind.StringLiteral:
      return parseLiteral(p, p.getCurrentToken().value as string);
    case SyntaxKind.NullKeyword:
      return parseLiteral(p, null);
    case SyntaxKind.TrueKeyword:
      return parseLiteral(p, true);
    case SyntaxKind.FalseKeyword:
      return parseLiteral(p, false);
    case SyntaxKind.LeftParen:
      return parseParenthesizedExpression(p);
    case SyntaxKind.LeftBrace:
      return parseObjectLiteral(p);
    case SyntaxKind.LeftBracket:
      return parseArrayLiteral(p);
    case SyntaxKind.FunctionKeyword:
      return parseFunctionExpression(p);
    case SyntaxKind.NewKeyword:
      return parseNewExpression(p);
    case SyntaxKind.Divide:
    case SyntaxKind.DivideAssign:
      if (
        p.reReadDivisionToken().type === SyntaxKind.RegularExpressionLiteral
      ) {
        return parseRegExpLiteral(p);
      }
  }
  return raise(p, Errors.UnexpectedToken, SyntaxKind[token.type]);
}

export function parseThisExpression(p: Parser): ESTree.ThisExpression {
  let startToken = p.getCurrentToken();
  p.readToken();
  return {
    type: "ThisExpression",
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseIdentifier(p: Parser): ESTree.Identifier {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.Identifier);
  // p.readToken();   因为修改了expect函数
  return {
    type: "Identifier",
    name: startToken.value as string,
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseLiteral(
  p: Parser,
  value: string | number | boolean | null
): ESTree.Literal {
  let startToken = p.getCurrentToken();
  p.readToken();
  return {
    type: "Literal",
    value,
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseRegExpLiteral(p: Parser): ESTree.RegExpLiteral {
  let startToken = p.getCurrentToken();
  p.readToken();
  return {
    type: "Literal",
    value: startToken.value as RegExp,
    regex: {
      pattern: (startToken.value as RegExp).source,
      flags: (startToken.value as RegExp).flags,
    },
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseArrayLiteral(p: Parser): ESTree.ArrayExpression {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.LeftBracket);
  let elements = [];
  while (p.getCurrentToken().type !== SyntaxKind.RightBracket) {
    // if (p.getCurrentToken().type === SyntaxKind.Comma) {
    //   elements.push(val);
    //   val = null;
    //   val = parseAssignmentExpression(p);
    // } else {
    //   break;
    //   val = parseAssignmentExpression(p);
    //   // if (p.getCurrentToken().type === SyntaxKind.RightBracket) {
    //   //   elements.push(val);
    //   //   break;
    //   // }
    // }

    elements.push(
      p.getCurrentToken().type === SyntaxKind.Comma
        ? null
        : parseAssignmentExpression(p)
    );
    if (p.getCurrentToken().type === SyntaxKind.Comma) p.readToken();
    else break;
  }
  expect(p, SyntaxKind.RightBracket);
  return {
    type: "ArrayExpression",
    elements,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseObjectLiteral(p: Parser): ESTree.ObjectExpression {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.LeftBrace);
  let properties = [];

  while (true) {
    if (p.getCurrentToken().type === SyntaxKind.RightBrace) break;
    properties.push(parsePropertyAssignment(p));
    if (p.getCurrentToken().type === SyntaxKind.Comma) p.readToken();
    else break;
  }
  expect(p, SyntaxKind.RightBrace);
  // p.readToken();   因为修改了expect函数
  return {
    type: "ObjectExpression",
    properties,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseExpression(
  p: Parser
): ESTree.SequenceExpression | ESTree.Expression {
  let startToken = p.getCurrentToken();
  let expressionList = [];
  expressionList.push(parseAssignmentExpression(p));
  while (p.getCurrentToken().type === SyntaxKind.Comma) {
    p.readToken();
    expressionList.push(parseAssignmentExpression(p));
  }
  if (expressionList.length === 1) {
    return expressionList[0];
  }
  return {
    type: "SequenceExpression",
    expressions: expressionList,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseParenthesizedExpression(
  p: Parser
): ESTree.SequenceExpression | ESTree.Expression {
  expect(p, SyntaxKind.LeftParen);
  // p.readToken();   因为修改了expect函数
  let expr = parseExpression(p);
  expect(p, SyntaxKind.RightParen);
  // p.readToken();   因为修改了expect函数
  return expr;
}

export function parseConditionalExpression(
  p: Parser,
  condition: ESTree.Expression
): ESTree.ConditionalExpression {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.QuestionMark);
  let consequent = parseAssignmentExpression(p);
  expect(p, SyntaxKind.Colon);
  let alternate = parseAssignmentExpression(p);
  return {
    type: "ConditionalExpression",
    test: condition,
    consequent,
    alternate,
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseBinaryExpression(p: Parser): ESTree.Expression {
  // 先解析一元表达式
  // 然后进行操作符优先级比较解析高优先级的操作符为binaryExpresssion,然后反复进行直到遇到结束二元操作的符号结束(除开一元,二元操作符号的所有符号例如 `;`  `,`  `)`  `=` `]` )
  //
  let left = parseUnaryExpression(p);
  return parseBinaryExpressionRest(p, left);
}

export function parseBinaryExpressionRest(
  p: Parser,
  left: ESTree.Expression
): ESTree.Expression {
  let operatorToken = p.getCurrentToken();
  if (
    !isBinaryOperatorToken(operatorToken) ||
    (operatorToken.type === SyntaxKind.InKeyword &&
      p.getParseContext() & ParseContext.DisallowInContext)
  ) {
    return left;
  }

  p.readToken(); // 消费 binaryOperator
  let right = parseUnaryExpression(p);
  let nextOperatorToken = p.getCurrentToken();

  if (!isBinaryOperatorToken(nextOperatorToken)) {
    // nextOperatorToken.type = SyntaxKind.EndOfFile; // 这里的是引用,因此不能这样修改会产生副作用!!!!!
    nextOperatorToken = { type: SyntaxKind.EndOfFile } as Token; // 直接设为0, 这样初始operatorToken.type > nextOperatorToken.type
  }

  let operator = SyntaxKind[operatorToken.type] as ESTree.BinaryOperator;
  // 比较优先级
  if (
    operatorToken.type < nextOperatorToken.type ||
    (operatorToken.type === nextOperatorToken.type &&
      checkBinaryOperatorRightAssociaticity(operatorToken)) // 实际上只有 `**` 操作
  ) {
    return {
      type: "BinaryExpression",
      loc: createExpressionLocation(p, operatorToken),
      left,
      right: parseBinaryExpressionRest(p, right),
      operator,
    };
  } else {
    return parseBinaryExpressionRest(p, {
      type: "BinaryExpression",
      loc: createExpressionLocation(p, operatorToken),
      left,
      right,
      operator,
    });
  }
}

export function parseUnaryExpression(p: Parser): ESTree.Expression {
  // if match unaryExpression
  // return {type:"unary"}
  //else return parseUpdateExpression()
  let token = p.getCurrentToken();
  if (
    token.type >= SyntaxKind.TypeofKeyword &&
    token.type <= SyntaxKind.Subtract
  ) {
    return {
      type: "UnaryExpression",
      prefix: true,
      loc: createExpressionLocation(p, token),
      operator: SyntaxKind[token.type],
      argument: parseUnaryExpression(p),
    };
  }
  return parseUpdateExpression(p);
}

// PostfixExpression 产生式
export function parseUpdateExpression(p: Parser): ESTree.Expression {
  // if match update operator
  // return ...
  // else return parseLeftHandSideExpression
  let startToken = p.getCurrentToken(),
    token = startToken,
    target;
  if (
    token.type === SyntaxKind.Increment ||
    token.type === SyntaxKind.Decrement
  ) {
    // 检查LHS有效性 -- 只有是Identifier 和 MemberExpression才有效
    p.readToken(); // 消费掉 `--` 或者 `++`
    let target = parseUnaryExpression(p);
    if (!checkReferenceExpression(target)) {
      raise(p, Errors.InvalidLHSInAssignment);
    }

    if (
      (p.getParseContext() | ParseContext.StrictModeContext &&
        (target as ESTree.Identifier).name === "eval") ||
      (target as ESTree.Identifier).name === "arguments"
    ) {
      raise(p, Errors.StrictLHSPrefixPostFix, "Prefix");
    }

    return {
      type: "UpdateExpression",
      prefix: true,
      loc: createExpressionLocation(p, startToken),
      operator: SyntaxKind[token.type] as ESTree.UpdateOperator,
      argument: target,
    };
  }
  target = parseLeftHandSideExpression(p);
  token = p.getCurrentToken();
  if (
    (token.type === SyntaxKind.Increment ||
      token.type === SyntaxKind.Decrement) &&
    !(token.context & TokenFlags.PrecedingLineBreak) // 后缀表达式不能被换行符分割
  ) {
    // 检查LHS有效性 -- 只有是Identifier 和 MemberExpression才有效
    if (!checkReferenceExpression(target)) {
      raise(p, Errors.InvalidLHSInAssignment);
    }
    p.readToken(); // 消费掉 `--` 或者 `++`
    return {
      type: "UpdateExpression",
      prefix: false,
      loc: createExpressionLocation(p, startToken),
      operator: SyntaxKind[token.type] as ESTree.UpdateOperator,
      argument: target,
    };
  } else return target;
}
export function parsePropertyAssignment(p: Parser): ESTree.Property {
  let startToken = p.getCurrentToken();
  let key: ESTree.Expression;
  let kind: "init" | "set" | "get" = "init";
  let value: ESTree.Expression;
  if (
    startToken.type === SyntaxKind.Identifier &&
    (startToken.value === "get" || startToken.value === "set")
  ) {
    kind = startToken.value;
    p.readToken();
  }
  let token = p.getCurrentToken();
  if (
    token.type === SyntaxKind.Identifier ||
    token.type === SyntaxKind.StringLiteral ||
    token.type === SyntaxKind.NumericLiteral
  ) {
    key = parsePrimaryExpression(p);
  } else {
    raise(p, Errors.Unexpected);
  }
  if (kind === "init") {
    expect(p, SyntaxKind.Colon);
    value = parseAssignmentExpression(p);
  } else if (kind === "get") {
    expect(p, SyntaxKind.LeftParen);
    // p.readToken();   因为修改了expect函数
    expect(p, SyntaxKind.RightParen);
    // p.readToken();   因为修改了expect函数
    expect(p, SyntaxKind.LeftBrace);
    // p.readToken();   因为修改了expect函数
    let body = parsefunctionBody(p);
    value = {
      type: "FunctionExpression",
      id: null,
      generator: false,
      async: false,
      params: [],
      body,
    } as ESTree.FunctionExpression;
    expect(p, SyntaxKind.RightBrace);
    // p.readToken();   因为修改了expect函数
  } else {
    let startToken = p.getCurrentToken();
    expect(p, SyntaxKind.LeftParen);
    // p.readToken();   因为修改了expect函数
    let params = parseFormalParameterList(p);
    if (params.length !== 1) {
      raise(p, Errors.BadSetterRestParameter);
    }

    expect(p, SyntaxKind.RightParen);
    // p.readToken();   因为修改了expect函数

    let body = parsefunctionBody(p);
    value = {
      type: "FunctionExpression",
      id: null,
      generator: false,
      async: false,
      params: [],
      body,
      loc: createExpressionLocation(p, startToken),
    } as ESTree.FunctionExpression;
    expect(p, SyntaxKind.RightBrace);
    // p.readToken();   因为修改了expect函数
  }
  return {
    type: "Property",
    kind,
    key,
    value,
    computed: false,
    method: false,
    shorthand: false,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseMemberExpression() {}

// 暂时只实现ES5, 因此这里返回Identifier[]
export function parseFormalParameterList(p: Parser): ESTree.Identifier[] {
  let params = [];
  while (p.getCurrentToken().type !== SyntaxKind.RightParen) {
    params.push(parseIdentifier(p));
    if (p.getCurrentToken().type === SyntaxKind.Comma) {
      p.readToken(); // 消费掉`,` Comma
    }
  }
  return params;
}
export function parsefunctionBody(p: Parser): ESTree.FunctionBody {
  let startToken = p.getCurrentToken();
  return {
    type: "FunctionBody",
    body: parseStatementList(p, true),
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseFunctionExpression(p: Parser): ESTree.FunctionExpression {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.FunctionKeyword);
  // 保存oldLabelSet
  let oldLabelSet = p.getLabelSet();
  p.setLabelSet([]);

  let name: ESTree.Identifier | null = null;
  // if (p.readToken().type === SyntaxKind.Identifier) { 因为修改了expect函数
  if (p.getCurrentToken().type === SyntaxKind.Identifier) {
    name = parseIdentifier(p);
  }
  expect(p, SyntaxKind.LeftParen);
  // p.readToken();     因为修改了expect函数
  let params = parseFormalParameterList(p);
  expect(p, SyntaxKind.RightParen);
  // p.readToken();     因为修改了expect函数
  let body = parsefunctionBody(p);

  p.setLabelSet(oldLabelSet);
  return {
    type: "FunctionExpression",
    id: name,
    params,
    body,
    async: false,
    generator: false,
    loc: createExpressionLocation(p, startToken),
  };
}
export function parseAssignmentExpression(p: Parser): ESTree.Expression {
  //
  // AssignmentExpression :
  //      ConditionalExpression
  //      LeftHandSideExpression AssignmentOperator AssignmentExpression
  //
  let startToken = p.getCurrentToken();
  let expr = parseBinaryExpression(p); // 这里等价于产生式的ConditionalExpression
  // 判断是否为赋值表达式
  if (
    isAssignmentOperator(p.getCurrentToken()) &&
    isLHSE(expr) &&
    checkReferenceExpression(expr)
  ) {
    let operator = token2String(
      p.getCurrentToken()
    ) as ESTree.AssignmentOperator;
    p.readToken(); // 消费 operator
    let right = parseAssignmentExpression(p);

    return {
      type: "AssignmentExpression",
      loc: createExpressionLocation(p, startToken),
      operator,
      left: expr,
      right,
    };
  } else if (p.getCurrentToken().type === SyntaxKind.QuestionMark) {
    expr = parseConditionalExpression(p, expr);
  }
  return expr;
}

export function parseLeftHandSideExpression(
  p: Parser,
  allowCall = true // NewExpression的()优先级最高,因此,在解析NewExpresssion时,不允许解析成CallExpression
): ESTree.Expression {
  //
  // https://tc39.es/ecma262/#prod-LeftHandSideExpression
  //
  // 左值表达式的含义就是要计算出一个左值,根据产生式
  // LeftHandSideExpression[Yield, Await]:
  //      NewExpression[?Yield, ?Await]
  //      CallExpression[?Yield, ?Await]
  //      OptionalExpression[?Yield, ?Await]
  //
  // 其实就是要得出一个值
  // SuperExpression(ESTree), NewExpression(ESTree),
  // PrimaryExpression(这里指的产生式,可以推导出很多ESTree结构的表达式),
  // ComputedMemberExpression(ESTree), StaticMemberExpression(ESTree), TemplateExpression(ESTree), CallExpression(ESTree)

  let startToken = p.getCurrentToken();
  let expr: ESTree.Expression =
    startToken.type === SyntaxKind.NewKeyword
      ? parseNewExpression(p)
      : parsePrimaryExpression(p);

  while (true) {
    let token = p.getCurrentToken();
    if (token.type === SyntaxKind.Period) {
      p.readToken();
      expr = {
        type: "MemberExpression",
        object: expr,
        property: parseIdentifier(p),
        computed: false,
        loc: createExpressionLocation(p, startToken),
      };
    } else if (allowCall && token.type === SyntaxKind.LeftParen) {
      // allowCall控制是否这里解析成CallExpression
      expr = {
        type: "CallExpression",
        arguments: parseArgumentList(p),
        callee: expr,
        loc: createExpressionLocation(p, startToken),
      };
    } else if (token.type === SyntaxKind.LeftBracket) {
      p.readToken(); // 消费 `[`
      let property = parsePrimaryExpression(p);
      expect(p, SyntaxKind.RightBracket);
      expr = {
        type: "MemberExpression",
        object: expr,
        property,
        computed: true,
        loc: createExpressionLocation(p, startToken),
      };
    } else {
      break;
    }
  }

  // p.setParseContext(  )
  return expr;
}
// export function parseCallExpression() {}
export function parseArgumentList(p: Parser): ESTree.Expression[] {
  expect(p, SyntaxKind.LeftParen);
  let args = [];
  while (p.getCurrentToken().type !== SyntaxKind.RightParen) {
    args.push(parseAssignmentExpression(p));
  }
  expect(p, SyntaxKind.RightParen);
  return args;
}

export function parseNewExpression(p: Parser): ESTree.NewExpression {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.NewKeyword);
  // let token = p.readToken();     因为修改了expect函数

  let callee = parseLeftHandSideExpression(p, false);

  let args =
    p.getCurrentToken().type === SyntaxKind.LeftParen
      ? parseArgumentList(p)
      : [];
  return {
    type: "NewExpression",
    callee,
    arguments: args,
    loc: createExpressionLocation(p, startToken),
  };
}

// @ts-ignore dreprecated
function parseMemberExpressionOrHigher(
  p: Parser,
  allowCall: boolean
): ESTree.Expression {
  let startToken = p.getCurrentToken();
  let expr =
    startToken.type === SyntaxKind.NewKeyword
      ? parseNewExpression(p)
      : parsePrimaryExpression(p);

  while (true) {
    let token = p.getCurrentToken();
    if (token.type === SyntaxKind.Period) {
      p.readToken();
      expr = {
        type: "MemberExpression",
        object: expr,
        property: parseIdentifier(p),
        computed: false,
        loc: createExpressionLocation(p, startToken),
      };
    } else if (allowCall && token.type === SyntaxKind.LeftParen) {
      expr = {
        type: "CallExpression",
        arguments: parseArgumentList(p),
        callee: expr,
        loc: createExpressionLocation(p, startToken),
      };
    } else if (token.type === SyntaxKind.LeftBracket) {
      let property = parsePrimaryExpression(p);
      expect(p, SyntaxKind.RightBracket);
      expr = {
        type: "MemberExpression",
        object: expr,
        property,
        computed: true,
        loc: createExpressionLocation(p, startToken),
      };
    } else {
      break;
    }
  }
  return expr;
}

export function parseDirective(p: Parser): ESTree.Literal | null {
  let token = p.getCurrentToken();
  let directive: ESTree.Literal | null = null;
  if (token.type === SyntaxKind.StringLiteral) {
    directive = {
      type: "Literal",
      loc: createExpressionLocation(p, token),
      value: token.value as string,
    };
  }
  consumeSemicolon(p);
  return directive;
}

export function parseDirectivePrologues(p: Parser): (ESTree.Literal | null)[] {
  let list = [];
  let expr: ESTree.Literal | null;
  while (true) {
    expr = parseDirective(p);
    if (expr === null) {
      break;
    }
    if (expr.value === "use strict") {
      p.enableParseContext(
        ParseContext.StrictModeContext | p.getParseContext()
      );
    }
    list.push(expr);
  }
  return list;
}
