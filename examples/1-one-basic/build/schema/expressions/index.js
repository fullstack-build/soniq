"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("@fullstack-one/graphql");
exports.currentUserId = new graphql_1.Expression({
    gqlReturnType: "Boolean",
    authRequired: true,
    generateSql: (getExpression, getColumn) => {
        return `_auth.current_user_id()`;
    }
});
const OwnerFactory = (columnName) => {
    return new graphql_1.Expression({
        gqlReturnType: "Boolean",
        authRequired: true,
        generateSql: (getExpression, getColumn) => {
            return `${getExpression(exports.currentUserId)} = ${getColumn(columnName)}`;
        }
    });
};
exports.anyone = new graphql_1.Expression({
    gqlReturnType: "Boolean",
    generateSql: (getExpression, getColumn) => {
        return `TRUE`;
    }
});
exports.ownerById = OwnerFactory("id");
exports.ownerByOwnerId = OwnerFactory("ownerId");
