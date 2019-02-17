import { ObjectTypeDefinitionNode, DefinitionNode, DocumentNode } from "graphql";

import { IDbMeta } from "..";
import { IReadViewMeta } from "./readViewBuilder/interfaces";
import { ICreateViewMeta } from "./createViewBuilder/interfaces";
import { IUpdateViewMeta } from "./updateViewBuilder/interfaces";
import { IDeleteViewMeta } from "./deleteViewBuilder/interfaces";
import { IExpression, IExpressionInput } from "./createExpressions";

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export interface ITableData {
  gqlTypeName: string;
  schemaName: string;
  tableName: string;
  gqlTypeDefinition: ObjectTypeDefinitionNode;
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

export interface IMutationViewsByName {
  [name: string]: IMutationView;
}

export interface IMutationView {
  name?: string;
  fields: string[];
  expressions: IExpressionInput;
  returnOnlyId?: boolean;
}

export interface IPermissionMeta {
  disableSecurityBarrierForReadViews?: boolean;
}

export interface IPermission {
  gqlTypeName: "Post";
  readExpressions: IReadExpressions;
  createViews: IMutationViewsByName;
  updateViews: IMutationViewsByName;
  deleteExpressions: IExpressionInput;
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
    [name: string]: ICreateViewMeta | IUpdateViewMeta | IDeleteViewMeta;
  };
  permissionMeta: {
    [gqlTypeName: string]: IPermissionMeta;
  };
}
