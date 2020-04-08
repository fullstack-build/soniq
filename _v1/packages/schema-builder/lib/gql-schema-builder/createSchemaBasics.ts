import { DefinitionNode } from "graphql";
import { createBeginTransactionMutation, createCommitTransactionMutation } from "./createTransactionMutations";

export function createSchemaBasics(): ReadonlyArray<DefinitionNode> {
  const definitions = [];

  definitions.push({
    kind: "SchemaDefinition",
    directives: [],
    operationTypes: [
      {
        kind: "OperationTypeDefinition",
        operation: "query",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: "Query"
          }
        }
      },
      {
        kind: "OperationTypeDefinition",
        operation: "mutation",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: "Mutation"
          }
        }
      }
    ]
  });

  definitions.push({
    kind: "ObjectTypeDefinition",
    name: {
      kind: "Name",
      value: "Query"
    },
    interfaces: [],
    directives: [],
    fields: []
  });

  definitions.push({
    kind: "ObjectTypeDefinition",
    name: {
      kind: "Name",
      value: "Mutation"
    },
    interfaces: [],
    directives: [],
    fields: []
  });

  definitions.push({
    kind: "ScalarTypeDefinition",
    name: {
      kind: "Name",
      value: "JSON"
    },
    directives: []
  });

  definitions.push(createBeginTransactionMutation());
  definitions.push(createCommitTransactionMutation());

  return definitions;
}
