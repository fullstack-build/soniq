function getViewnamesArgument(viewsEnumName) {
  return {
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'viewnames'
      },
      type: {
        kind: 'ListType',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: viewsEnumName
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

export default (viewsEnumName, inputType) => {

  const args = [
    getInputArgument(inputType),
    getViewnamesArgument(viewsEnumName)
  ];

  return args;
};
