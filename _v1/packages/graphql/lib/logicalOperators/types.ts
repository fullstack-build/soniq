interface IBaseOperatorContext {
  field: string;
}

export interface ISingleValueOperatorContext extends IBaseOperatorContext {
  value: string;
}

export interface IBooleanOperatorContext extends IBaseOperatorContext {
  value: string;
}

export interface IMultiValueOperatorContext extends IBaseOperatorContext {
  values: string[];
}

interface IBaseOperator {
  name: string;
  value: string;
  schemaExtension?: string;
  unsafeValue?: boolean;
}

export interface ISingleValueOperator extends IBaseOperator {
  getSql(context: ISingleValueOperatorContext): string;
}

export interface IMultiValueOperator extends IBaseOperator {
  getSql(context: IMultiValueOperatorContext): string;
}

export interface IBooleanOperator extends ISingleValueOperator {
  isBooleanOperator: true;
}

export type IOperator = IBooleanOperator | ISingleValueOperator | IMultiValueOperator;

export interface IOperatorObject {
  [key: string]: IOperator;
}

export function isSingleValueOperator(operator: IOperator): operator is ISingleValueOperator {
  return !operator.value.startsWith("[");
}

export function isBooleanOperator(operator: IOperator): operator is IBooleanOperator {
  return (operator as IBooleanOperator).isBooleanOperator === true;
}

export function isMultiValueOperator(operator: IOperator): operator is IMultiValueOperator {
  return operator.value.startsWith("[");
}
