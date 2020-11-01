import { SourceLocation } from "./estree";

export class Token {
  type!: SyntaxKind;
  value: string | number | RegExp | null;
  loc!: SourceLocation;
  context!: TokenFlags;
  constructor(
    type: SyntaxKind,
    loc: SourceLocation,
    value: string | number | RegExp | null = null,
    context: TokenFlags = TokenFlags.None
  ) {
    this.type = type;
    this.value = value;
    this.loc = loc;
    this.context = context;
  }
}
export enum SyntaxKind {
  EndOfFile, // eof
  Identifier, // 标识符
  NumericLiteral, // 数字字面量
  StringLiteral, // string字面量
  RegularExpressionLiteral, // 正则表达式
  FalseKeyword, // false
  TrueKeyword, // true
  NullKeyword, // null

  /* Template nodes */
  TemplateCont, // 模板continue
  TemplateTail, // 模板尾部

  /* Punctuators */
  Arrow, // =>
  LeftParen, // (
  LeftBrace, // {
  Period, // .
  Ellipsis, // ...
  RightBrace, // }
  RightParen, // )
  Semicolon, // ;
  Comma, // ,
  LeftBracket, // [
  RightBracket, // ]
  Colon, // :
  QuestionMark, // ?
  SingleQuote, // '
  DoubleQuote, // "

  /* Update operators */
  Increment, // ++
  Decrement, // --

  /* Assign operators */
  Assign, // =
  ShiftLeftAssign, // <<=
  ShiftRightAssign, // >>=
  LogicalShiftRightAssign, // >>>=
  ExponentiateAssign, // **=
  AddAssign, // +=
  SubtractAssign, // -=
  MultiplyAssign, // *=
  DivideAssign, // /=
  ModuloAssign, // %=
  BitwiseXorAssign, // ^=
  BitwiseOrAssign, // |=
  BitwiseAndAssign, // &=

  /* Unary/binary operators */
  TypeofKeyword, // typeof
  DeleteKeyword, // delete
  VoidKeyword, // void
  Negate, // !
  Complement, // ~
  Add, // +
  Subtract, // -
  InKeyword, // in
  InstanceofKeyword, // instanceof
  Multiply, // *
  Modulo, // %
  Divide, // /
  Exponentiate, // **             es6+ 暂不实现
  LogicalAnd, // &&
  LogicalOr, // ||
  StrictEqual, // ===
  StrictNotEqual, // !==
  LooseEqual, // ==
  LooseNotEqual, // !=
  LessThanOrEqual, // <=
  GreaterThanOrEqual, // >=
  LessThan, // <
  GreaterThan, // >
  ShiftLeft, // <<
  ShiftRight, // >>
  LogicalShiftRight, // >>>
  BitwiseAnd, // &
  BitwiseOr, // |
  BitwiseXor, // ^

  /* Variable declaration kinds */
  VarKeyword, // var
  LetKeyword, // let
  ConstKeyword, // const

  /* Other reserved words */
  BreakKeyword, // break
  CaseKeyword, // case
  CatchKeyword, // catch
  ClassKeyword, // class
  ContinueKeyword, // continue
  DebuggerKeyword, // debugger
  DefaultKeyword, // default
  DoKeyword, // do
  ElseKeyword, // else
  ExportKeyword, // export
  ExtendsKeyword, // extends
  FinallyKeyword, // finally
  ForKeyword, // for
  FunctionKeyword, // function
  IfKeyword, // if
  ImportKeyword, // import
  NewKeyword, // new
  ReturnKeyword, // return
  SuperKeyword, // super
  SwitchKeyword, // switch
  ThisKeyword, // this
  ThrowKeyword, // throw
  TryKeyword, // try
  WhileKeyword, // while
  WithKeyword, // with

  /* Strict mode reserved words */
  ImplementsKeyword, // implements
  InterfaceKeyword, // interface
  PackageKeyword, // package
  PrivateKeyword, // private
  ProtectedKeyword, // protected
  PublicKeyword, // public
  StaticKeyword, // static
  YieldKeyword, // yield

  /* Contextual keywords */
  AsKeyword, // as
  AsyncKeyword, // async
  AwaitKeyword, // await
  ConstructorKeyword, // constructor
  GetKeyword, // get
  SetKeyword, // set
  FromKeyword, // from
  OfKeyword, // of
  EnumKeyword, // enum
}

export const enum CharacterCodes {
  nullCharacter = 0,
  maxAsciiCharacter = 0x7f,

  lineFeed = 0x0a, // \n
  carriageReturn = 0x0d, // \r
  lineSeparator = 0x2028,
  paragraphSeparator = 0x2029,
  nextLine = 0x0085,

  // Unicode 3.0 space characters
  space = 0x0020, // " "
  nonBreakingSpace = 0x00a0, //
  enQuad = 0x2000,
  emQuad = 0x2001,
  enSpace = 0x2002,
  emSpace = 0x2003,
  threePerEmSpace = 0x2004,
  fourPerEmSpace = 0x2005,
  sixPerEmSpace = 0x2006,
  figureSpace = 0x2007,
  punctuationSpace = 0x2008,
  thinSpace = 0x2009,
  hairSpace = 0x200a,
  zeroWidthSpace = 0x200b,
  narrowNoBreakSpace = 0x202f,
  ideographicSpace = 0x3000,
  mathematicalSpace = 0x205f,
  ogham = 0x1680,

  _ = 0x5f,
  $ = 0x24,

  _0 = 0x30,
  _1 = 0x31,
  _2 = 0x32,
  _3 = 0x33,
  _4 = 0x34,
  _5 = 0x35,
  _6 = 0x36,
  _7 = 0x37,
  _8 = 0x38,
  _9 = 0x39,

  a = 0x61,
  b = 0x62,
  c = 0x63,
  d = 0x64,
  e = 0x65,
  f = 0x66,
  g = 0x67,
  h = 0x68,
  i = 0x69,
  j = 0x6a,
  k = 0x6b,
  l = 0x6c,
  m = 0x6d,
  n = 0x6e,
  o = 0x6f,
  p = 0x70,
  q = 0x71,
  r = 0x72,
  s = 0x73,
  t = 0x74,
  u = 0x75,
  v = 0x76,
  w = 0x77,
  x = 0x78,
  y = 0x79,
  z = 0x7a,

  A = 0x41,
  B = 0x42,
  C = 0x43,
  D = 0x44,
  E = 0x45,
  F = 0x46,
  G = 0x47,
  H = 0x48,
  I = 0x49,
  J = 0x4a,
  K = 0x4b,
  L = 0x4c,
  M = 0x4d,
  N = 0x4e,
  O = 0x4f,
  P = 0x50,
  Q = 0x51,
  R = 0x52,
  S = 0x53,
  T = 0x54,
  U = 0x55,
  V = 0x56,
  W = 0x57,
  X = 0x58,
  Y = 0x59,
  Z = 0x5a,

  ampersand = 0x26, // &
  asterisk = 0x2a, // *
  at = 0x40, // @
  backslash = 0x5c, // \
  backtick = 0x60, // `
  bar = 0x7c, // |
  caret = 0x5e, // ^
  closeBrace = 0x7d, // }
  closeBracket = 0x5d, // ]
  closeParen = 0x29, // )
  colon = 0x3a, // :
  comma = 0x2c, // ,
  dot = 0x2e, // .
  doubleQuote = 0x22, // "
  equals = 0x3d, // =
  exclamation = 0x21, // !
  greaterThan = 0x3e, // >
  hash = 0x23, // #
  lessThan = 0x3c, // <
  minus = 0x2d, // -
  openBrace = 0x7b, // {
  openBracket = 0x5b, // [
  openParen = 0x28, // (
  percent = 0x25, // %
  plus = 0x2b, // +
  question = 0x3f, // ?
  semicolon = 0x3b, // ;
  singleQuote = 0x27, // '
  slash = 0x2f, // /
  tilde = 0x7e, // ~

  backspace = 0x08, // \b
  formFeed = 0x0c, // \f
  byteOrderMark = 0xfeff,
  tab = 0x09, // \t
  verticalTab = 0x0b, // \v
}

export const enum TokenFlags {
  None = 0,
  PrecedingLineBreak = 1 << 0,
  PrecedingJSDocComment = 1 << 1,
  Unterminated = 1 << 2,
  ExtendedUnicodeEscape = 1 << 3,
  Scientific = 1 << 4, // e.g. `10e2`
  Octal = 1 << 5, // e.g. `0777`
  HexSpecifier = 1 << 6, // e.g. `0x00000000`
  BinarySpecifier = 1 << 7, // e.g. `0b0110010000000000`
  OctalSpecifier = 1 << 8, // e.g. `0o777`
  ContainsSeparator = 1 << 9, // e.g. `0b1100_0101`
  UnicodeEscape = 1 << 10,
  ContainsInvalidEscape = 1 << 11, // e.g. `\uhello`
  BinaryOrOctalSpecifier = BinarySpecifier | OctalSpecifier,
  NumericLiteralFlags = Scientific |
    Octal |
    HexSpecifier |
    BinaryOrOctalSpecifier |
    ContainsSeparator,
}

export const string2SyntaxKind: {
  [name: string]: SyntaxKind;
} = {
  /* Keywords */
  await: SyntaxKind.AwaitKeyword,
  break: SyntaxKind.BreakKeyword,
  case:  SyntaxKind.CaseKeyword,
  catch: SyntaxKind.CatchKeyword,
  class: SyntaxKind.ClassKeyword,
  const: SyntaxKind.ConstKeyword,
  continue: SyntaxKind.ContinueKeyword,
  debugger: SyntaxKind.DebuggerKeyword,
  default: SyntaxKind.DefaultKeyword,
  delete: SyntaxKind.DeleteKeyword,
  do: SyntaxKind.DoKeyword,
  else: SyntaxKind.ElseKeyword,
  export: SyntaxKind.ExportKeyword,
  extends: SyntaxKind.ExtendsKeyword,
  finally: SyntaxKind.FinallyKeyword,
  for: SyntaxKind.ForKeyword,
  function: SyntaxKind.FunctionKeyword,
  if: SyntaxKind.IfKeyword,
  import: SyntaxKind.ImportKeyword,
  in: SyntaxKind.InKeyword,
  instanceof: SyntaxKind.InstanceofKeyword,
  new: SyntaxKind.NewKeyword,
  return: SyntaxKind.ReturnKeyword,
  super:SyntaxKind.SuperKeyword,
  switch: SyntaxKind.SwitchKeyword,
  this: SyntaxKind.ThisKeyword,
  throw: SyntaxKind.ThrowKeyword,
  try: SyntaxKind.TryKeyword,
  typeof: SyntaxKind.TypeofKeyword,
  var: SyntaxKind.VarKeyword,
  void: SyntaxKind.VoidKeyword,
  while: SyntaxKind.WhileKeyword,
  with: SyntaxKind.WithKeyword,
  yield:SyntaxKind.YieldKeyword,

  /* Keywords In Strict Mode */ 
  let: SyntaxKind.LetKeyword,
  static: SyntaxKind.StaticKeyword,

  /* BooleanLiteral */ 
  false: SyntaxKind.FalseKeyword,
  true: SyntaxKind.TrueKeyword,

  /* NullLiteral */ 
  null: SyntaxKind.NullKeyword,

  /* FutureReservedWord */
  enum: SyntaxKind.EnumKeyword,

  /*  FutureReservedWord In Strict Mode */
  implements: SyntaxKind.ImplementsKeyword,
  interface: SyntaxKind.InterfaceKeyword,
  package: SyntaxKind.PackageKeyword,
  private: SyntaxKind.PrivateKeyword,
  protected: SyntaxKind.ProtectedKeyword,
  public: SyntaxKind.PublicKeyword,

};

export const enum ParseContext {
  None                  = 0,
  StrictModeContext     = 1 << 0,
  DisallowInContext     = 1 << 1,
  InWithStatement       = 1 << 2,
  InForStatement        = 1 << 3,
  InSwitchStatement     = 1 << 4,
  InIterationStatement  = 1 << 5,
  ParentheziedContext   = 1 << 6,
  AwaitContext          = 1 << 7,
  YieldContext          = 1 << 8,
}

export const OperatorPrecedece = {
  [SyntaxKind.Comma]: 0,
  [SyntaxKind.Ellipsis]: 1,
};

export function token2String(t: Token): string {
  return SyntaxKind[t.type];
}
