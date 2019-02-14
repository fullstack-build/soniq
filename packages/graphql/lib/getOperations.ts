import { utils } from "@fullstack-one/schema-builder";
import { DocumentNode, DefinitionNode, DirectiveNode } from "graphql";
import { IResolverObject } from "graphql-tools";
const parseDirectives: (directiveNodes: ReadonlyArray<DirectiveNode>) => { custom?: { params: object; resolver: string } } = utils.parseDirectives;

interface IBaseOperation {
  name: string;
  type: string;
  resolver: any;
  params: object;
  viewName?: string;
}

export type TQueryOperation = IBaseOperation;
export type TMutationOperation = IBaseOperation;
export type TFieldOperation = IBaseOperation & { gqlTypeName: string; fieldName: string };

export interface IOperations {
  queries: TQueryOperation[];
  mutations: TMutationOperation[];
  fields: TFieldOperation[];
}

export function getOperations(gqlDocument: DocumentNode): IOperations {
  const queries: TQueryOperation[] = [];
  const mutations: TMutationOperation[] = [];
  const fields: TFieldOperation[] = [];

  Object.values(gqlDocument.definitions).forEach((node) => {
    if (node.kind === "ObjectTypeExtension") {
      const type = node.name.value;
      Object.values(node.fields).forEach((field) => {
        const fieldName = field.name.value;
        const directives = parseDirectives(field.directives);

        if (directives.custom != null && directives.custom.resolver != null) {
          const params = directives.custom.params || {};

          if (type === "Query") {
            queries.push({
              name: fieldName,
              type,
              resolver: directives.custom.resolver,
              params
            });
          }

          if (type === "Mutation") {
            mutations.push({
              name: fieldName,
              type,
              resolver: directives.custom.resolver,
              params
            });
          }
        }
      });
    }
    if (node.kind === "ObjectTypeDefinition") {
      const gqlTypeName = node.name.value;
      Object.values(node.fields).forEach((field) => {
        const fieldName = field.name.value;
        const directives = parseDirectives(field.directives);

        if (directives.custom != null && directives.custom.resolver != null) {
          const params = directives.custom.params || {};

          fields.push({
            name: fieldName,
            type: "FIELD",
            gqlTypeName,
            fieldName,
            resolver: directives.custom.resolver,
            params
          });
        }
      });
    }
  });

  return {
    queries,
    mutations,
    fields
  };
}
