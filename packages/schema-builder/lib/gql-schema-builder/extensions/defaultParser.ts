import { IParser, IParseReadFieldContext, IParseUpdateFieldContext, IParseCreateFieldContext } from "./interfaces";

const defaultParser: IParser = {
  parseReadField,
  parseUpdateField,
  parseCreateField
};

export default defaultParser;

function parseReadField(ctx: IParseReadFieldContext) {
  const { fieldName, readExpressions } = ctx;

  // Has field any permission-expression - without at least one expression it is not queryable at all
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

function parseUpdateField(ctx: IParseUpdateFieldContext) {
  const { gqlFieldDefinition, view, fieldName } = ctx;

  if (view.fields.indexOf(fieldName) >= 0) {
    return [gqlFieldDefinition];
  }
  return null;
}

function parseCreateField(ctx: IParseCreateFieldContext) {
  return parseUpdateField(ctx);
}
