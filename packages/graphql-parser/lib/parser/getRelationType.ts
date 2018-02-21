export default (field) => {

  if (field.type.kind === 'NamedType') {
    return 'ONE';
  }

  if (field.type.kind === 'NonNullType' && field.type.type.kind === 'NamedType') {
    return 'ONE';
  }

  if (field.type.kind === 'NonNullType' &&
      field.type.type.kind === 'ListType' &&
      field.type.type.type.kind === 'NonNullType' &&
      field.type.type.type.type.kind === 'NamedType') {
    return 'MANY';
  }

  return null;
};
