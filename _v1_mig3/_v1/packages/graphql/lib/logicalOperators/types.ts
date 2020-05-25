export interface IOperatorContext {
  fieldPgSelector: string;
  value: any;
  getParam: (value: any) => string;
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
