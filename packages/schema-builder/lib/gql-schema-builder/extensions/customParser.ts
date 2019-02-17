import { IParseReadFieldContext, IParseUpdateFieldContext, IParser, IParseCreateFieldContext } from "./interfaces";

const customParser: IParser = {
  parseReadField: (ctx: IParseReadFieldContext) => {
    const { fieldName, readExpressions, directives } = ctx;

    // Has field any permission-expression - without at least one expression it is not queryable at all
    if (readExpressions[fieldName] != null && directives.custom != null) {
      const { defaultFieldCreator } = ctx;

      const columnExpression = "NULL::text";

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
          gqlFieldDefinition,
          isVirtual: true
        }
      ];
    }
    return null;
  },
  parseUpdateField: (ctx: IParseUpdateFieldContext) => {
    const { view, fieldName, directives } = ctx;

    if (view.fields.indexOf(fieldName) >= 0 && directives.custom != null) {
      return [];
    }
    return null;
  },
  parseCreateField: (ctx: IParseCreateFieldContext) => {
    return customParser.parseUpdateField(ctx);
  }
};

export default customParser;
