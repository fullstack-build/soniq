export function parseReadField(ctx) {
  const { fieldName, readExpressions, directives } = ctx;

  // Has field any permission-expression - without at least one expression it is not queryable at all
  if (readExpressions[fieldName] != null && directives.computed != null && directives.computed.expression != null) {
    const { expressionCreator, defaultFieldCreator } = ctx;

    const computedExpression = expressionCreator.getExpressionObject(directives.computed.expression, directives.computed.params);

    const columnExpression = `"${computedExpression.name}"."${computedExpression.name}"`;

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
  const { gqlFieldDefinition, view, fieldName, directives } = ctx;

  if (view.fields.indexOf(fieldName) >= 0 && directives.computed != null) {
    return [];
  }
  return null;
}

export function parseCreateField(ctx) {
  return parseUpdateField(ctx);
}
