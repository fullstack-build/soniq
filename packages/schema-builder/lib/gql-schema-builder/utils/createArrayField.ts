export function createArrayField(fieldName, type) {
  return {
    kind: "FieldDefinition",
    name: {
      kind: "Name",
      value: fieldName
    },
    arguments: [],
    type: {
      kind: "ListType",
      type: {
        kind: "NonNullType",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: type
          }
        }
      }
    },
    directives: []
  };
}
