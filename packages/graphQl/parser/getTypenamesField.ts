function getTypenamesField(typesEnumName) {
  return {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: '_typenames'
    },
    arguments: [],
    type: {
      kind: 'NonNullType',
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
      }
    },
    directives: []
  };
}

export default (typesEnumName) => {

  return getTypenamesField(typesEnumName);
};
