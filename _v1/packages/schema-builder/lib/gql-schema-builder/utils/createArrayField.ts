import { FieldDefinitionNode } from "graphql";

export function createArrayField(fieldName: string, type: string): FieldDefinitionNode {
  return {
    kind: "FieldDefinition",
    name: {
      kind: "Name",
      value: fieldName
    },
    arguments: [],
    type: {
      kind: "ListType",
      type: {
        kind: "NonNullType",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: type
          }
        }
      }
    },
    directives: []
  };
}
