"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseView(ctx) {
    const viewName = ctx.view.viewName;
    const view = ctx.view;
    const tableName = ctx.view.tableName;
    const schemaName = ctx.schemaName;
    const viewSchemaName = ctx.viewSchemaName;
    const gqlTypeName = ctx.view.gqlTypeName;
    // creates SQL expressions for view
    Object.values(view.expressions).forEach((expression) => {
        if (ctx.expressionsByName[expression.name] == null) {
            throw new Error('Expression `' + expression.name + '` does not exist. You used it in table `' + gqlTypeName + '`.');
        }
        const expressionContext = {
            gqlTypeName: view.gqlTypeName,
            table: `"${schemaName}"."${tableName}"`,
            tableName,
            schemaName,
            field: null,
            view: `"${viewSchemaName}"."${viewName}"`,
            viewName,
            viewSchemaName,
            currentUserId: () => {
                ctx.gQlTypes[gqlTypeName].authViewNames.push(viewName);
                const viewIndex = ctx.gQlTypes[gqlTypeName].noAuthViewNames.indexOf(viewName);
                if (viewIndex >= 0) {
                    ctx.gQlTypes[gqlTypeName].noAuthViewNames.splice(viewIndex, 1);
                }
                return '_meta.current_user_id()';
            }
        };
        const expressionSql = ctx.expressionsByName[expression.name].generate(expressionContext, expression.params || {});
        ctx.dbView.expressions.push(expressionSql);
    });
}
exports.parseView = parseView;
