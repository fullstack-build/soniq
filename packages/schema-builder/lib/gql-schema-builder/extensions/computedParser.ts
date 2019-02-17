import { IParser, IParseReadFieldContext, IParseUpdateFieldContext } from "./interfaces";

const computedParser: IParser = {
  parseReadField: (ctx: IParseReadFieldContext) => {
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
  },
  parseUpdateField: (ctx: IParseUpdateFieldContext) => {
    const { view, fieldName, directives } = ctx;

    if (view.fields.indexOf(fieldName) >= 0 && directives.computed != null) {
      return [];
    }
    return null;
  },
  parseCreateField: (ctx) => {
    return computedParser.parseUpdateField(ctx);
  }
};

export default computedParser;
