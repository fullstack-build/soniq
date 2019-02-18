import { DocumentNode, ObjectTypeExtensionNode, DefinitionNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { utils } from "@fullstack-one/schema-builder";

import { IOperationsObject, TQueryOperation, TMutationOperation, TFieldOperation, IBaseOperation, IFieldNodeAndDirectivesObject } from "./types";
export * from "./types";

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

function getBaseOperations(definitionNodes: ReadonlyArray<DefinitionNode>, gqlTypeName: "Query" | "Mutation"): IBaseOperation[] {
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
    directivesObject: utils.parseDirectives(fieldNode.directives)
  };
}

function hasCustomDirective(directivesObject: utils.IDirectivesObject): boolean {
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
