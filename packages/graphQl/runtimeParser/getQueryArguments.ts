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

function getSqlArgument() {
  return {
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: 'sql',
        },
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'String',
          },
        },
        defaultValue: null,
        directives: [],
      };
}

export default (typesEnumName) => {

  const args = [
    getTypenamesArgument(typesEnumName),
    getSqlArgument()
  ];

  return args;
};
