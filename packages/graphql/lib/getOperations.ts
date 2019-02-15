import { utils } from "@fullstack-one/schema-builder";
import { DocumentNode, DirectiveNode, ObjectTypeExtensionNode, DefinitionNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";

interface IDirectivesObject {
  custom?: { params?: any; resolver: string };
}
const parseDirectives: (directiveNodes: ReadonlyArray<DirectiveNode>) => IDirectivesObject = utils.parseDirectives;

interface IBaseOperation {
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

interface IFieldNodeAndDirectivesObject {
  fieldNode: FieldDefinitionNode;
  directivesObject: IDirectivesObject;
}

export function getOperationsObject({ definitions }: DocumentNode): IOperationsObject {
  const queries: TQueryOperation[] = getBaseOperations(definitions, "Query");
  const mutations: TMutationOperation[] = getBaseOperations(definitions, "Mutation");
  const fields: TFieldOperation[] = getFieldOperations(definitions);

  return {
    queries,
    mutations,
    fields
  };
}

function getBaseOperations(definitionNodes: ReadonlyArray<DefinitionNode>, gqlTypeName: string): IBaseOperation[] {
  return definitionNodes
    .filter((definitionNode) => definitionNode.kind === "ObjectTypeExtension" && definitionNode.name.value === gqlTypeName)
    .map((definitionNode: ObjectTypeExtensionNode) => definitionNode.fields)
    .reduce((x, y) => x.concat(y), [])
    .map(toFieldNodeAndDirectivesObject)
    .filter(({ directivesObject }) => hasCustomDirective(directivesObject))
    .map((item) => toBaseOperation(item, gqlTypeName));
}

function getFieldOperations(definitionNodes: ReadonlyArray<DefinitionNode>): TFieldOperation[] {
  return definitionNodes
    .filter((definitionNode) => definitionNode.kind === "ObjectTypeDefinition")
    .map(({ fields, name }: ObjectTypeDefinitionNode) => toFieldOperations(fields, name.value))
    .reduce((x, y) => x.concat(y), []);
}

function toFieldNodeAndDirectivesObject(fieldNode: FieldDefinitionNode): IFieldNodeAndDirectivesObject {
  return {
    fieldNode,
    directivesObject: parseDirectives(fieldNode.directives)
  };
}

function hasCustomDirective(directivesObject: IDirectivesObject): boolean {
  return directivesObject.custom != null && directivesObject.custom.resolver != null;
}

function toBaseOperation({ fieldNode, directivesObject }: IFieldNodeAndDirectivesObject, gqlTypeName: string): IBaseOperation {
  return {
    name: fieldNode.name.value,
    type: gqlTypeName,
    resolver: directivesObject.custom.resolver,
    params: directivesObject.custom.params || {}
  };
}

function toFieldOperations(fieldNodes: ReadonlyArray<FieldDefinitionNode>, gqlTypeName: string): TFieldOperation[] {
  return fieldNodes
    .map(toFieldNodeAndDirectivesObject)
    .filter(({ directivesObject }) => hasCustomDirective(directivesObject))
    .map((item) => toFieldOperation(item, gqlTypeName));
}

function toFieldOperation({ fieldNode, directivesObject }: IFieldNodeAndDirectivesObject, gqlTypeName: string): TFieldOperation {
  return {
    name: fieldNode.name.value,
    type: "FIELD",
    gqlTypeName,
    fieldName: fieldNode.name.value,
    resolver: directivesObject.custom.resolver,
    params: directivesObject.custom.params || {}
  };
}
