import { parse } from "../test-utils";

describe("Expressions - Additive", () => {
  test("UpdateExpression - postfix increment", () => {
    let program = parse(`x ++`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "UpdateExpression",
        operator: "Increment",
        argument: {
          type: "Identifier",
          name: "x",
        },
        prefix: false,
      },
    });
  });

  test("UpdateExpression -  postfix decrement", () => {
    let program = parse(`x --`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "UpdateExpression",
        operator: "Decrement",
        argument: {
          type: "Identifier",
          name: "x",
        },
        prefix: false,
      },
    });
  });

  test("UpdateExpression -  prefix increment", () => {
    let program = parse(`++x`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "UpdateExpression",
        operator: "Increment",
        argument: {
          type: "Identifier",
          name: "x",
        },
        prefix: true,
      },
    });
  });

  test("UpdateExpression -  prefix decrement", () => {
    let program = parse(`--x`);
    expect(program.body.length).toBe(1);
    expect(program.body[0]).toMatchObject({
      type: "ExpressionStatement",
      expression: {
        type: "UpdateExpression",
        operator: "Decrement",
        argument: {
          type: "Identifier",
          name: "x",
        },
        prefix: true,
      },
    });
  });
});
