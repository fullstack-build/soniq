export function parseReadField(ctx) {
  const { fieldName, readExpressions } = ctx;

  // Has field any permission-expression
  if (readExpressions[fieldName] != null) {
    const { localTable, defaultFieldCreator } = ctx;

    const columnExpression = `"${localTable}"."${fieldName}"`;

    const { publicFieldSql, authFieldSql, gqlFieldDefinition } = defaultFieldCreator.create(
      readExpressions[fieldName],
      JSON.parse(JSON.stringify(ctx.gqlFieldDefinition)),
      columnExpression,
      fieldName
    );

    return [
      {
        gqlFieldName: fieldName,
        nativeFieldName: fieldName,
        publicFieldSql,
        authFieldSql,
        gqlFieldDefinition
      }
    ];
  }
  return null;
}

export function parseUpdateField(ctx) {
  const { gqlFieldDefinition, view, fieldName } = ctx;

  if (view.fields.indexOf(fieldName) >= 0) {
    return [gqlFieldDefinition];
  }
  return null;
}

export function parseCreateField(ctx) {
  return parseUpdateField(ctx);
}
