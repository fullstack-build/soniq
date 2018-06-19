
function getInputArgument(gqlInputTypeName) {
  return {
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'input'
      },
      type: {
        kind: 'NonNullType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: gqlInputTypeName
          }
      }},
      defaultValue: null,
      directives: []
    };
}

export function createMutationArguments(gqlInputTypeName) {
  return [
    getInputArgument(gqlInputTypeName)
  ];
}
