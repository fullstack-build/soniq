function getViewnamesField(typesEnumName) {
  return {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: '_viewnames'
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

  return getViewnamesField(typesEnumName);
};
