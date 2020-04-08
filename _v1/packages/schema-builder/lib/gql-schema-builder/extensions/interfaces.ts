import { FieldDefinitionNode, InputValueDefinitionNode, DocumentNode } from "graphql";

import { IReadExpressions, ITableData, IPermissionContext, IResolverMeta, IMutationView } from "../interfaces";
import { ExpressionCompiler } from "../expressions/ExpressionCompiler";
import { CreateDefaultField } from "../readViewBuilder/defaultFieldCreator";
import { ICreateViewMeta } from "../createViewBuilder/interfaces";
import { IUpdateViewMeta } from "../updateViewBuilder/interfaces";
import { IDeleteViewMeta } from "../deleteViewBuilder/interfaces";

export interface IParseReadFieldContext {
  readExpressions: IReadExpressions;
  gqlFieldDefinition: FieldDefinitionNode;
  directives: any;
  expressionCreator: ExpressionCompiler;
  defaultFieldCreator: CreateDefaultField;
  fieldName: string;
  localTable: string;
  permissionContext: IPermissionContext;
  getQueryArguments: (gqlTypeName: string) => ReadonlyArray<InputValueDefinitionNode>;
  table: ITableData;
}

export interface IParseCreateFieldContext {
  directives: any;
  fieldName: string;
  gqlFieldDefinition: FieldDefinitionNode;
  localTable: string;
  permissionContext: IPermissionContext;
  table: ITableData;
  view: IMutationView<any>;
}

export interface IParseUpdateFieldContext {
  directives: any;
  fieldName: string;
  gqlFieldDefinition: FieldDefinitionNode;
  localTable: string;
  permissionContext: IPermissionContext;
  table: ITableData;
  view: IMutationView<any>;
}

export interface IModifyMutationResult {
  extendArguments?: any;
  mutation?: ICreateViewMeta | IUpdateViewMeta | IDeleteViewMeta;
}

export interface IParser {
  parseReadField?: (ctx: IParseReadFieldContext) => any;
  parseCreateField?: (ctx: IParseCreateFieldContext) => any;
  parseUpdateField?: (ctx: IParseUpdateFieldContext) => any;
  modifyMutation?: (mutationMeta: ICreateViewMeta | IUpdateViewMeta | IDeleteViewMeta) => IModifyMutationResult | null;
  extendDefinitions?: (gqlDocumentNode: DocumentNode, resolverMeta: IResolverMeta, sql: any[]) => any;
}
