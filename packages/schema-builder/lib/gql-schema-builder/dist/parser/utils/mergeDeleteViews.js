"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (views) => {
    const newPermissions = [];
    const deleteExpressionsByTableName = {};
    Object.values(views).forEach((view) => {
        if (view.type === 'DELETE') {
            if (deleteExpressionsByTableName[view.table] == null) {
                deleteExpressionsByTableName[view.table] = {
                    gqlTypeName: view.gqlTypeName,
                    expressions: {}
                };
            }
            Object.values(view.expressions).forEach((expression) => {
                const key = JSON.stringify(expression);
                deleteExpressionsByTableName[view.table].expressions[key] = expression;
            });
        }
        else {
            newPermissions.push(view);
        }
    });
    Object.values(deleteExpressionsByTableName).forEach((value) => {
        const view = {
            name: 'GeneratedDeleteView',
            type: 'DELETE',
            gqlTypeName: value.gqlTypeName,
            fields: ['id'],
            expressions: []
        };
        Object.values(value.expressions).forEach((expression) => {
            view.expressions.push(expression);
        });
        newPermissions.push(view);
    });
    return newPermissions;
};
