import { Parser } from "./parser";
import * as ESTree from "./estree";
import { createExpressionLocation, expect } from "./common";
import { SyntaxKind } from "./types";
import {
  parseAssignmentExpression,
  parseFormalParameterList,
  parsefunctionBody,
  parseIdentifier,
} from "./expression";
// es6+
// function parseClassDeclaration() {}
// function parseHostedClassDeclaration() {}
// function parseHoistableFunctionDeclaration() {}
// function parseLexicalDeclaration() {}
// function parseVariableDeclarationList() {}
// function parseVariableDeclaration() {}

// es5
export function parseFunctionDeclaration(
  p: Parser
): ESTree.FunctionDeclaration {
  let startToken = p.getCurrentToken();
  expect(p, SyntaxKind.FunctionKeyword);

  // 保存oldLabelSet
  let oldLabelSet = p.getLabelSet();
  p.setLabelSet([]);

  let id = parseIdentifier(p);
  expect(p, SyntaxKind.LeftParen);
  let params = parseFormalParameterList(p);
  expect(p, SyntaxKind.RightParen);
  expect(p, SyntaxKind.LeftBrace);
  let body = parsefunctionBody(p);
  expect(p, SyntaxKind.RightBrace);
  p.setLabelSet(oldLabelSet);
  return {
    type: "FunctionDeclaration",
    id,
    params,
    body,
    generator: false,
    async: false,
    loc: createExpressionLocation(p, startToken),
  };
}

export function parseVariableDeclarator(p: Parser): ESTree.VariableDeclarator {
  let startToken = p.getCurrentToken();
  let id = parseIdentifier(p);
  let init = null;
  if (p.getCurrentToken().type === SyntaxKind.Assign) {
    p.readToken();
    init = parseAssignmentExpression(p);
  }
  return {
    type: "VariableDeclarator",
    id,
    init,
    loc: createExpressionLocation(p, startToken),
  };
}
