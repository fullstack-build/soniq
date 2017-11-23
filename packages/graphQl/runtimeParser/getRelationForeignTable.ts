export default (field) => {

  if (field.type.kind === 'NamedType') {
    return field.type.value.value;
  }

  if (field.type.kind === 'NonNullType' && field.type.type.kind === 'NamedType') {
    return field.type.type.value.value;
  }

  if (field.type.kind === 'NonNullType' &&
      field.type.type.kind === 'ListType' &&
      field.type.type.type.kind === 'NonNullType' &&
      field.type.type.type.type.kind === 'NamedType') {
    return field.type.type.type.value.value;
  }

  return null;
};
