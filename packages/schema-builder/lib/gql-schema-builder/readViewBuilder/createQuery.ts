import { ObjectTypeExtensionNode } from "graphql";
import { getQueryArguments } from "./getQueryArguments";

export function createQuery(name, gqlTypeName): ObjectTypeExtensionNode {
  return {
    kind: "ObjectTypeExtension",
    name: {
      kind: "Name",
      value: "Query"
    },
    interfaces: [],
    directives: [],
    fields: [
      {
        kind: "FieldDefinition",
        description: {
          kind: "StringValue",
          value: `Returns an array of ${name}.`,
          block: true
        },
        name: {
          kind: "Name",
          value: name
        },
        arguments: getQueryArguments(gqlTypeName),
        type: {
          kind: "NonNullType",
          type: {
            kind: "ListType",
            type: {
              kind: "NonNullType",
              type: {
                kind: "NamedType",
                name: {
                  kind: "Name",
                  value: gqlTypeName
                }
              }
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
                  value: "@fullstack-one/graphql/queryResolver",
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
