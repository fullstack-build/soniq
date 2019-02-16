import { DefinitionNode } from "graphql";

export interface IReadView {
  meta: IReadViewMeta;
  authViewSql: string[];
  publicViewSql: string[];
  gqlDefinition: DefinitionNode;
}

export interface IReadViewMeta {
  viewSchemaName: string;
  publicViewName: string;
  authViewName: string;
  publicFieldNames: string[];
  authFieldNames: string[];
  fields: IReadFields;
  tableName: string;
  tableSchemaName: string;
}

export interface IReadFields {
  [gqlFieldName: string]: IReadFieldData;
}

export interface IReadFieldData {
  gqlFieldName: string;
  nativeFieldName: string;
  isVirtual: boolean;
  meta: any;
}
