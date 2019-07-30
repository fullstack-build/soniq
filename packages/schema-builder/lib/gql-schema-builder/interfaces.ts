import { ObjectTypeDefinitionNode, DefinitionNode, DocumentNode } from "graphql";

import { IDbMeta } from "..";
import { IReadViewMeta } from "./readViewBuilder/interfaces";
import { ICreateViewMeta } from "./createViewBuilder/interfaces";
import { IUpdateViewMeta } from "./updateViewBuilder/interfaces";
import { IDeleteViewMeta } from "./deleteViewBuilder/interfaces";
import { IExpression, IExpressionInput } from "./ExpressionCompiler";

export * from "./readViewBuilder/interfaces";
export * from "./createViewBuilder/interfaces";
export * from "./updateViewBuilder/interfaces";
export * from "./deleteViewBuilder/interfaces";
export type IMutationViewMeta = ICreateViewMeta | IUpdateViewMeta | IDeleteViewMeta;
export * from "./ExpressionCompiler";

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export interface ITableData {
  gqlTypeName: string;
  schemaName: string;
  tableName: string;
  gqlTypeDefinition: ObjectTypeDefinitionNode;
  directives: IDirectives;
}

export interface IDirectives {
  [name: string]: any;
}

export interface IPermissionView {
  gqlDefinitions: DefinitionNode[];
  meta: IReadViewMeta;
  sql: string[];
}

export interface IConfig {
  userName: string;
  schemaName: string;
  databaseName: string;
}

export interface IPermissionContext {
  gqlDocument: DocumentNode;
  dbMeta: IDbMeta;
  expressions: IExpression[];
}

export interface IReadExpressions {
  [fieldName: string]: IExpressionInput;
}

export interface IMutationViewsByName<TClass> {
  [name: string]: IMutationView<TClass>;
}

export interface IMutationView<TClass> {
  name?: string;
  fields: Array<keyof TClass>;
  expressions: IExpressionInput;
  returnOnlyId?: boolean;
}

export interface IPermissionMeta {
  disableSecurityBarrierForReadViews?: boolean;
  disallowGenericRootLevelAggregation?: boolean;
}

export interface IPermission<TClass = any> {
  gqlTypeName: string;
  readExpressions?: IReadExpressions;
  createViews?: IMutationViewsByName<TClass>;
  updateViews?: IMutationViewsByName<TClass>;
  deleteExpressions?: IExpressionInput;
  meta?: IPermissionMeta;
}

export interface IOperator {
  name: string;
  value: string;
  extendSchema?: string;
  unsafeValue?: boolean;
  getSql: (context: IOperatorContext) => string;
}

export interface IOperatorContext {
  field: string;
  value?: string;
  values?: string[];
}

export interface IOperatorsByName {
  [name: string]: IOperator;
}

export interface IOperatorsByKey {
  [key: string]: IOperator;
}

export interface IRelationMeta {
  foreignGqlTypeName: string;
  isNonNullType: boolean;
  isListType: boolean;
}

export interface ICompiledPermissionMeta {
  query: IPermissionQueries;
  mutation: IPermissionMutations;
  meta: any;
}

// tslint:disable-next-line:no-empty-interface
export interface IPermissionQueries {}

// tslint:disable-next-line:no-empty-interface
export interface IPermissionMutations {}

export interface IResolverMeta {
  query: {
    [gqlTypeName: string]: IReadViewMeta;
  };
  mutation: {
    [name: string]: IMutationViewMeta;
  };
  permissionMeta: {
    [gqlTypeName: string]: IPermissionMeta;
  };
}
