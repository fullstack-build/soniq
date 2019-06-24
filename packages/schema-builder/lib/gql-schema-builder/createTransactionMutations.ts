import { ObjectTypeExtensionNode } from "graphql";

export function createBeginTransactionMutation(): ObjectTypeExtensionNode {
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
          value: "beginTransaction"
        },
        arguments: [
          // I removed this for the first version to save some time and set the focus on important features of transactional mutations
          /* {
            kind: "InputValueDefinition",
            name: {
              kind: "Name",
              value: "isolationLevel"
            },
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "String"
              }
            },
            defaultValue: null,
            directives: []
          } */
        ],
        type: {
          kind: "NonNullType",
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String"
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
                  value: "@fullstack-one/graphql/beginTransactionResolver",
                  block: false
                }
              },
              {
                kind: "Argument",
                name: {
                  kind: "Name",
                  value: "usesQueryRunnerFromContext"
                },
                value: {
                  kind: "BooleanValue",
                  value: false
                }
              }
            ]
          }
        ]
      }
    ]
  };
}

export function createCommitTransactionMutation(): ObjectTypeExtensionNode {
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
          value: "commitTransaction"
        },
        arguments: [],
        type: {
          kind: "NonNullType",
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String"
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
                  value: "@fullstack-one/graphql/commitTransactionResolver",
                  block: false
                }
              },
              {
                kind: "Argument",
                name: {
                  kind: "Name",
                  value: "usesQueryRunnerFromContext"
                },
                value: {
                  kind: "BooleanValue",
                  value: true
                }
              }
            ]
          }
        ]
      }
    ]
  };
}
