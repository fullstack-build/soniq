import { ObjectTypeDefinitionNode, DefinitionNode, DocumentNode, InputValueDefinitionNode, FieldDefinitionNode } from "graphql";
import { IReadViewMeta } from "./readViewBuilder/interfaces";
import { IDbMeta } from "..";
import { IExpression, IExpressionInput, CreateExpressions } from "./createExpressions";
import { CreateDefaultField } from "./readViewBuilder/defaultFieldCreator";

export interface ITableData {
  gqlTypeName: string;
  schemaName: string;
  tableName: string;
  gqlTypeDefinition: ObjectTypeDefinitionNode;
}

export interface IPermissionView {
  gqlDefinitions: DefinitionNode[];
  meta: IReadViewMeta | any;
  sql: string[];
}

export interface IConfig {
  userName: string;
  schemaName: string;
  databaseName: string;
}

export interface IParseReadFieldContext {
  readExpressions: IReadExpressions;
  gqlFieldDefinition: FieldDefinitionNode;
  directives: any;
  expressionCreator: CreateExpressions;
  defaultFieldCreator: CreateDefaultField;
  fieldName: string;
  localTable: string;
  permissionContext: IPermissionContext;
  getQueryArguments: (gqlTypeName: string) => InputValueDefinitionNode[];
  table: ITableData;
}

export interface IParser {
  parseReadField?: (ctx: IParseReadFieldContext) => any;
  parseCreateField?: (ctx: IParseReadFieldContext) => any;
  parseUpdateField?: (ctx: IParseReadFieldContext) => any;
}

export interface IPermissionContext {
  gqlDocument: DocumentNode | any;
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
