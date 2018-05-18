export type IExpressionGenerator = (context: any, params: any) => string;

export interface IExpression {
  name: string;
  returnType: 'Boolean' | 'String' | 'Int' | 'Float';
  generate: IExpressionGenerator;
}

export interface IExpressions {
  [index: number]: IExpression;
}

export interface IViewExpression {
  name: string;
  params ?: any;
}

export interface IView {
  type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  name: string;
  gqlTypeName: string;
  fields: string[];
  expressions: IViewExpression[];
}

export interface IViews {
  [index: number]: IView;
}
