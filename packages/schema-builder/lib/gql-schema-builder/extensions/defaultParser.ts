import { IParser, IParseReadFieldContext, IParseUpdateFieldContext } from "./interfaces";

const defaultParser: IParser = {
  parseReadField: (ctx: IParseReadFieldContext) => {
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
  },
  parseUpdateField: (ctx: IParseUpdateFieldContext) => {
    const { gqlFieldDefinition, view, fieldName } = ctx;

    if (view.fields.indexOf(fieldName) >= 0) {
      return [gqlFieldDefinition];
    }
    return null;
  },
  parseCreateField: (ctx) => {
    return defaultParser.parseUpdateField(ctx);
  }
};

export default defaultParser;
