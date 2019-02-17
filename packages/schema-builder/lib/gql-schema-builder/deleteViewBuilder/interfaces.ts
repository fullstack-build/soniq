import { ObjectTypeDefinitionNode } from "graphql";

export interface IDeleteView {
  gqlDefinitions: ObjectTypeDefinitionNode[];
  meta: IDeleteViewMeta;
  sql: any[];
}

export interface IDeleteViewMeta {
  name: string;
  viewSchemaName: string;
  viewName: string;
  type: "DELETE";
  requiresAuth: boolean;
  gqlTypeName: string;
  gqlReturnTypeName: "ID";
  extensions: any;
  gqlInputTypeName: string;
}
