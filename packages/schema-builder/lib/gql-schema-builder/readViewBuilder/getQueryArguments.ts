import { InputValueDefinitionNode } from "graphql";

function getLimitArgument(): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "limit"
    },
    type: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: "Int"
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getOffsetArgument(): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "offset"
    },
    type: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: "Int"
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getWhereArgument(gqlTypeName: string): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "where"
    },
    type: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: `${gqlTypeName}Filter`
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getOrderByArgument(gqlTypeName: string): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: "orderBy"
    },
    type: {
      kind: "ListType",
      type: {
        kind: "NonNullType",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: `${gqlTypeName}OrderBy`
          }
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

export function getQueryArguments(gqlTypeName: string): InputValueDefinitionNode[] {
  return [getWhereArgument(gqlTypeName), getOrderByArgument(gqlTypeName), getLimitArgument(), getOffsetArgument()];
}
