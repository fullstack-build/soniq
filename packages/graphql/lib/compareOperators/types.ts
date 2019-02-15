export interface ISingleValueOperatorContext {
  field: string;
  value: string;
}

export interface IMultiValueOperatorContext {
  field: string;
  values: string[];
}

interface IBaseOperator {
  name: string;
  value: string;
}

export interface ISingleValueOperator extends IBaseOperator {
  getSql(context: ISingleValueOperatorContext): string;
}

export interface IMultiValueOperator extends IBaseOperator {
  getSql(context: IMultiValueOperatorContext): string;
}

export interface IBooleanOperator extends ISingleValueOperator {
  schemaExtension: string;
  unsafeValue: boolean;
}

export type IOperator = IBooleanOperator | ISingleValueOperator | IMultiValueOperator;

export interface IOperatorObject {
  [key: string]: IOperator;
}

export function isSingleValueOperator(operator: IOperator): operator is ISingleValueOperator {
  return !operator.value.startsWith("[");
}

export function isMultiValueOperator(operator: IOperator): operator is IMultiValueOperator {
  return operator.value.startsWith("[");
}

export function isBooleanOperator(operator: IOperator): operator is IBooleanOperator {
  return (operator as IBooleanOperator).schemaExtension != null;
}
