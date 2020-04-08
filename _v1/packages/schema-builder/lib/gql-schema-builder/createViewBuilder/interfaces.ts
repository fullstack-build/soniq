import { ObjectTypeDefinitionNode } from "graphql";

export interface ICreateView {
  gqlDefinitions: ObjectTypeDefinitionNode[];
  meta: ICreateViewMeta;
  sql: any[];
}

export interface ICreateViewMeta {
  name: string;
  viewSchemaName: string;
  viewName: string;
  type: "CREATE";
  requiresAuth: boolean;
  gqlTypeName: string;
  gqlReturnTypeName: string;
  extensions: any;
  gqlInputTypeName: string;
}
