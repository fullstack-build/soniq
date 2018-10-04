export function createIdField(fieldName, isNonNullType: boolean = false) {
  const field: any = {
    kind: "FieldDefinition",
    name: {
      kind: "Name",
      value: fieldName
    },
    arguments: [],
    type: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: "ID"
      }
    },
    directives: []
  };

  if (isNonNullType === true) {
    field.type = {
      kind: "NonNullType",
      type: field.type
    };
  }

  return field;
}
