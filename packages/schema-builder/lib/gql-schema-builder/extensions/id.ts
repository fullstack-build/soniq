
export function parseUpdateField(ctx) {
  const { gqlFieldDefinition, view, fieldName } = ctx;

  if (fieldName === 'id') {
    if (gqlFieldDefinition.type.kind !== 'NonNullType') {
      gqlFieldDefinition.type = {
        kind: 'NonNullType',
        type: gqlFieldDefinition.type
      };
    }
    return [gqlFieldDefinition];
  }
  return null;
}
