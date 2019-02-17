import { IParser, IParseReadFieldContext, IParseUpdateFieldContext, IParseCreateFieldContext } from "./interfaces";

const computedParser: IParser = {
  parseReadField,
  parseUpdateField,
  parseCreateField
};

export default computedParser;

function parseReadField(ctx: IParseReadFieldContext) {
  const { fieldName, readExpressions, directives } = ctx;

  // Has field any permission-expression - without at least one expression it is not queryable at all
  if (readExpressions[fieldName] != null && directives.computed != null && directives.computed.expression != null) {
    const { expressionCreator, defaultFieldCreator } = ctx;

    const computedExpression = expressionCreator.getCompiledExpression(directives.computed.expression, directives.computed.params);

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

function parseUpdateField(ctx: IParseUpdateFieldContext) {
  const { view, fieldName, directives } = ctx;

  if (view.fields.indexOf(fieldName) >= 0 && directives.computed != null) {
    return [];
  }
  return null;
}

function parseCreateField(ctx: IParseCreateFieldContext) {
  return parseUpdateField(ctx);
}
