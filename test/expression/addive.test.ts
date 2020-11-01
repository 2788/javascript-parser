import { parse } from "../test-utils";

describe("Expressions - Additive", () => {
  test("AdditiveExpression - add", () => {
    let program = parse(`x + y`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "BinaryExpression",
        operator: "Add",
        left: {
          type: "Identifier",
          name: "x",
        },
        right: {
          type: "Identifier",
          name: "y",
        },
      },
    });
  });

  test("AdditiveExpression - minus", () => {
    let program = parse(`x - y`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "BinaryExpression",
        operator: "Subtract",
        left: {
          type: "Identifier",
          name: "x",
        },
        right: {
          type: "Identifier",
          name: "y",
        },
      },
    });
  })

});
