import { ObjectTypeExtensionNode, InputValueDefinitionNode } from "graphql";
import { createMutationArguments } from "./createMutationArguments";

export function createMutation(
  name: string,
  gqlTypeName: string,
  gqlInputTypeName: string,
  extendArguments: ReadonlyArray<InputValueDefinitionNode>
): ObjectTypeExtensionNode {
  return {
    kind: "ObjectTypeExtension",
    name: {
      kind: "Name",
      value: "Mutation"
    },
    interfaces: [],
    directives: [],
    fields: [
      {
        kind: "FieldDefinition",
        description: {
          kind: "StringValue",
          value: "", // Mutates type ${gqlTypeName}.
          block: true
        },
        name: {
          kind: "Name",
          value: name
        },
        arguments: createMutationArguments(gqlInputTypeName).concat(extendArguments),
        type: {
          kind: "NonNullType",
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: gqlTypeName
            }
          }
        },
        directives: [
          {
            kind: "Directive",
            name: {
              kind: "Name",
              value: "custom"
            },
            arguments: [
              {
                kind: "Argument",
                name: {
                  kind: "Name",
                  value: "resolver"
                },
                value: {
                  kind: "StringValue",
                  value: "@fullstack-one/graphql/mutationResolver",
                  block: false
                }
              }
            ]
          }
        ]
      }
    ]
  };
}
