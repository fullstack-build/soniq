import { ObjectTypeDefinitionNode } from "graphql";

export interface IUpdateView {
  gqlDefinitions: ObjectTypeDefinitionNode[];
  meta: IUpdateViewMeta;
  sql: any[];
}

export interface IUpdateViewMeta {
  name: string;
  viewSchemaName: string;
  viewName: string;
  type: "UPDATE";
  requiresAuth: boolean;
  gqlTypeName: string;
  gqlReturnTypeName: string;
  extensions: any;
  gqlInputTypeName: string;
}
