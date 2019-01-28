import { EnumValueDefinitionNode, EnumTypeDefinitionNode } from "graphql";

function getEnumValue(value: string): EnumValueDefinitionNode {
  return {
    kind: "EnumValueDefinition",
    name: {
      kind: "Name",
      value
    },
    directives: []
  };
}

function getEnumDefinition(name: string, values: string[]): EnumTypeDefinitionNode {
  return {
    kind: "EnumTypeDefinition",
    name: {
      kind: "Name",
      value: name
    },
    directives: [],
    values: values.map(getEnumValue)
  };
}

export function getEnum(name: string, values: string[]) {
  return getEnumDefinition(name, values);
}
