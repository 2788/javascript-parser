import { parse } from "../test-utils";

describe("PrimaryExpression", () => {
  test("this", () => {
    let program = parse(`this`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "ThisExpression",
      },
    });
  });

  test("Identifier", () => {
    let program = parse(`a`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "Identifier",
        name: "a",
      },
    });
  });

  describe("Literal", () => {
    test("string literal", () => {
      let program = parse(
        `'string'; 'Tom\\'s a boy'; "hello world"; "Tom\\"s a big boy"; "\\u0040"; "\\x40"`
      );
      expect(program.body.length).toBe(6);
      expect(program.body).toMatchObject([
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "string",
          },
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "Tom's a boy",
          },
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "hello world",
          },
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: 'Tom"s a big boy',
          },
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "@",
          },
        },
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "@",
          },
        },
      ]);
    });

    test("null", () => {
      let program = parse(`null`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: null,
        },
      });
    });

    test("true", () => {
      let program = parse(`true`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: true,
        },
      });
    });

    test("false", () => {
      let program = parse(`false`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: false,
        },
      });
    });

    test("DecimalLiteral", () => {
      let program = parse(`10`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 10,
        },
      });
    });

    test("OctalLiteral", () => {
      let program = parse(`0o013`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 0o013,
        },
      });
    });

    test("BinaryLiteral", () => {
      let program = parse(`0b101`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 0b101,
        },
      });
    });

    test("HexadecimalLiteral", () => {
      let program = parse(`0xae`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 0xae,
        },
      });
    });

    test("DecimalLiteral --  DecimalIntegerLiteral . DecimalDigitsopt ExponentPart", () => {
      let program = parse(`.102`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 0.102,
        },
      });
    });

    test("DecimalLiteral --  . DecimalDigits ExponentPartopt", () => {
      let program = parse(`.102e5`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 0.102e5,
        },
      });
    });

    test("DecimalLiteral --  DecimalIntegerLiteral ExponentPart", () => {
      let program = parse(`102e5`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: 102e5,
        },
      });
    });

    //
  });

  describe("ArrayLiteral", () => {
    test("ArrayLiteral --- Normal ", () => {
      let program = parse(`[1,2,3]`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "ArrayExpression",
          elements: [
            {
              type: "Literal",
              value: 1,
            },
            {
              type: "Literal",
              value: 2,
            },
            {
              type: "Literal",
              value: 3,
            },
          ],
        },
      });
    });

    test("ArrayLiteral -- with empty element", () => {
      let program = parse(`[,2,]`);
      expect(program.body.length).toBe(1);
      expect(program.body[0]).toMatchObject({
        type: "ExpressionStatement",
        expression: {
          type: "ArrayExpression",
          elements: [
            null,
            {
              type: "Literal",
              value: 2,
            },
          ],
        },
      });
    });
    //
  });

  test("ObjectLiteral", () => {
    let program = parse(`a = {a:100, b:100}`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "AssignmentExpression",
        operator: "Assign",
        left: {
          type: "Identifier",
          name: "a",
        },
        right: {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              method: false,
              shorthand: false,
              computed: false,
              key: {
                type: "Identifier",
                name: "a",
              },
              kind: "init",
              value: {
                type: "Literal",
                value: 100,
              },
            },
            {
              type: "Property",
              method: false,
              shorthand: false,
              computed: false,
              key: {
                type: "Identifier",
                name: "b",
              },
              kind: "init",
              value: {
                type: "Literal",
                value: 100,
              },
            },
          ],
        },
      },
    });
  });

  test("SequenceExpression", () => {
    let program = parse(`(1,2)`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "SequenceExpression",
        expressions: [
          {
            type: "Literal",
            value: 1,
          },
          {
            type: "Literal",
            value: 2,
          },
        ],
      },
    });
  });
  //
});
