import { IExpression } from "./ExpressionCompiler";

export const expressions: IExpression[] = [];

export function defineExpression<TParams>(expression: IExpression<TParams>) {
  if (expressions.find(({ name }) => expression.name === name) != null) {
    throw new Error(`Expression with name '${expression.name}' aleady exists.`);
  }

  expressions.push(expression);

  return (params?: TParams) => ({ name: expression.name, params });
}
