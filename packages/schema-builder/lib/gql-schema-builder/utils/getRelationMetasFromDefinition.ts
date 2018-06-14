export function getRelationMetasFromDefinition(field) {

  if (field.type.kind === 'NamedType') {
    return {
      foreignGqlTypeName: field.type.name.value,
      isNonNullType: false,
      isListType: false
    };
  }

  if (field.type.kind === 'NonNullType' && field.type.type.kind === 'NamedType') {
    return {
      foreignGqlTypeName: field.type.type.name.value,
      isNonNullType: true,
      isListType: false
    };
  }

  if (field.type.kind === 'NonNullType' &&
    field.type.type.kind === 'ListType' &&
    field.type.type.type.kind === 'NonNullType' &&
    field.type.type.type.type.kind === 'NamedType') {
    return {
      foreignGqlTypeName: field.type.type.type.type.name.value,
      isNonNullType: true,
      isListType: true
    };
  }

  return null;
}
