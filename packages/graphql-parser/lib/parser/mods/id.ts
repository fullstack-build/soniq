export function parseField(field, ctx) {
  const fieldName = field.name.value;
  const gqlTypeName = ctx.view.gqlTypeName;
  const viewName = ctx.view.viewName;
  const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;

  if (!isIncluded || ctx.view.type === 'CREATE') {
    return false;
  }

  // Id can be null if view operation is create => Remove NonNullType
  if (fieldName === 'id' && ctx.view.type === 'CREATE' && field.type.kind === 'NonNullType') {

    if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
      ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
    }

    // Remove NonNullType by jumping to the next hierarchy level
    field.type = field.type.type;
    ctx.tableView.fields.push(field);
    return true;
  }
  return false;
}
