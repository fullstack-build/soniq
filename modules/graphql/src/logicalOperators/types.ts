export interface IOperatorContext {
  fieldPgSelector: string;
  value: unknown;
  getParam: (value: unknown) => string;
}

export interface IOperator {
  name: string;
  gqlInputType: string;
  typeDefs?: string;
  getSql(context: IOperatorContext): string;
}

export interface IOperatorsByName {
  [key: string]: IOperator;
}
