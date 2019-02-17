import { ScalarTypeDefinitionNode } from "graphql";

export function createScalar(name: string): ScalarTypeDefinitionNode {
  return {
    kind: "ScalarTypeDefinition",
    name: {
      kind: "Name",
      value: name
    },
    directives: []
  };
}
