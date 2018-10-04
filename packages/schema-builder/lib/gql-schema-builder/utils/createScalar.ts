export function createScalar(name) {
  return {
    kind: "ScalarTypeDefinition",
    name: {
      kind: "Name",
      value: name
    },
    directives: []
  };
}
