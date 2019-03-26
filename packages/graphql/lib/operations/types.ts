import { FieldDefinitionNode } from "graphql";
import { utils } from "@fullstack-one/schema-builder";

export interface IBaseOperation {
  name: string;
  type: string;
  resolver: string;
  params: object;
  viewName?: string;
}

export type TQueryOperation = IBaseOperation;
export type TMutationOperation = IBaseOperation;
export type TFieldOperation = IBaseOperation & { gqlTypeName: string; fieldName: string };

export interface IOperationsObject {
  queries: TQueryOperation[];
  mutations: TMutationOperation[];
  fields: TFieldOperation[];
}

export interface IFieldNodeAndDirectivesObject {
  fieldNode: FieldDefinitionNode;
  directivesObject: utils.IDirectivesObject;
}
