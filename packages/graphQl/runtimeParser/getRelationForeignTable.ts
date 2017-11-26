export default (field) => {

  if (field.type.kind === 'NamedType') {
    return field.type.name.value;
  }

  if (field.type.kind === 'NonNullType' && field.type.type.kind === 'NamedType') {
    return field.type.type.name.value;
  }

  if (field.type.kind === 'NonNullType' &&
    field.type.type.kind === 'ListType' &&
    field.type.type.type.kind === 'NonNullType' &&
    field.type.type.type.type.kind === 'NamedType') {
    return field.type.type.type.type.name.value;
  }

  return null;
};
