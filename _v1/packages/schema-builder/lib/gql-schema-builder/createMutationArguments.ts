import { InputValueDefinitionNode } from "graphql";

function getInputArgument(gqlInputTypeName: string): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "input"
    },
    type: {
      kind: "NonNullType",
      type: {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: gqlInputTypeName
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getReturnIdArgument(): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "returnId"
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
  };
}

export function createMutationArguments(gqlInputTypeName: string): ReadonlyArray<InputValueDefinitionNode> {
  return [getInputArgument(gqlInputTypeName), getReturnIdArgument()];
}
