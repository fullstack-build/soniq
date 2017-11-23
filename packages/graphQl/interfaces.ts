export type IExpressionGenerator = (context: any, params: any) => string;

export interface IExpression {
  name: string;
  returnType: 'Boolean' | 'String' | 'Int' | 'Float';
  generate: IExpressionGenerator;
}

export interface IExpressions {
  [index: number]: IExpression;
}

export interface IPermissionExpression {
  name: string;
  params ?: any;
}

export interface IPermission {
  type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  name: string;
  table: string;
  fields: string[];
  expressions: IPermissionExpression[];
}

export interface IPermissions {
  [index: number]: IPermission;
}
