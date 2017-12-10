function getTypenamesArgument(typesEnumName) {
  return {
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'typenames'
      },
      type: {
        kind: 'ListType',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: typesEnumName
            }
          }
        }
      },
      defaultValue: null,
      directives: []
    };
}

function getInputArgument(inputType) {
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
            value: inputType
          }
      }},
      defaultValue: null,
      directives: []
    };
}

export default (typesEnumName, inputType) => {

  const args = [
    getInputArgument(inputType),
    getTypenamesArgument(typesEnumName)
  ];

  return args;
};
