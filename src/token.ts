export class Token {
  type!: string;
  value: string | number | RegExp | undefined;
}

//  `beforeExpr`用来消除正则表达式和除号的, 所有能后接一个表达式的token会被设置这个属性.
//  因此如果一个`/`跟着这种token后面,就是正则表达式
//
//  `startsExpr`用来检查此token是否结束yield表达式
//  直接开始一个表达式或者作为表达式的一部分都会被设置为真
//
//  `isAssign` 标记所有 `=`, `+=`, `-=`等等这样的赋值操作符,
//  它们表现的像只有很低优先级的二元运算符, 并且应该作为赋值表达式的节点.
class TokenType {
  label: string; // 字面量
  keyword: boolean; // 是否为关键字

  beforeExpr: boolean;
  startsExpr: boolean;
  isLoop: boolean; // 用来标志一个关键字token是loop的开始

  isAssign: boolean;

  prefix: boolean; // 单目

  postfix: boolean; // 单目

  binop: number | undefined; // 二元操作, 值表示优先级

  constructor(
    label: string,
    {
      keyword = false,
      beforeExpr = false,
      startsExpr = false,
      isLoop = false,
      isAssign = false,
      prefix = false,
      postfix = false,
      binop,
    }: Partial<TokenType> = {}
  ) {
    this.label = label;
    this.keyword = keyword;
    this.beforeExpr = beforeExpr;
    this.startsExpr = startsExpr;
    this.isLoop = isLoop;
    this.isAssign = isAssign;
    this.prefix = prefix;
    this.postfix = postfix;
    this.binop = binop;
  }
}

function binop(label: string, value: number): TokenType {
  return new TokenType(label, { binop: value });
}

function kw(label: string, properties: Partial<TokenType> = {}) {
  properties.keyword = true;
  return new TokenType(label, properties);
}

const beforeExpr = { beforeExpr: true },
  startsExpr = { startsExpr: true };

export const AllTokens: {
  [name: string]: TokenType;
} = {
  name: new TokenType("name", startsExpr),
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  eof: new TokenType("eof"), // 结束符token

  // 分隔符Token
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),

  // 操作符Token. 这些操作符的属性可以帮助parser合适地去解析它
  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }), // 用_=代替+=, -=, *=, /=, %=等等
  incDec: new TokenType("++/--", {
    prefix: true,
    postfix: true,
    startsExpr: true,
  }),
  prefix: new TokenType("!/~", {
    beforeExpr: true,
    prefix: true,
    startsExpr: true,
  }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", {
    beforeExpr: true,
    binop: 9,
    prefix: true,
    startsExpr: true,
  }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", { beforeExpr: true }),

  // 关键字token.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", { isLoop: true, beforeExpr: true }),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", { isLoop: true }),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", { isLoop: true }),
  _with: kw("with"),
  _new: kw("new", { beforeExpr: true, startsExpr: true }),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import", startsExpr),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", { beforeExpr: true, binop: 7 }),
  _instanceof: kw("instanceof", { beforeExpr: true, binop: 7 }),
  _typeof: kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true }),
  _void: kw("void", { beforeExpr: true, prefix: true, startsExpr: true }),
  _delete: kw("delete", { beforeExpr: true, prefix: true, startsExpr: true }),
};
