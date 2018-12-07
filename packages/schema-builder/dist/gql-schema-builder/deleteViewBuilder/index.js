"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createExpressions_1 = require("../createExpressions");
const helpers_1 = require("./helpers");
function buildDeleteView(table, expressionsInput, context, extensions, config) {
    // Get some data from table
    const { gqlTypeName, tableName, gqlTypeDefinition } = table;
    const sql = [];
    const mutationName = `${table.gqlTypeName}_DELETE`.toUpperCase();
    const gqlInputTypeName = mutationName;
    // Initialize meta object. Required for querybuilder
    const meta = {
        name: mutationName,
        viewSchemaName: config.schemaName,
        viewName: mutationName,
        type: "DELETE",
        requiresAuth: false,
        gqlTypeName,
        gqlReturnTypeName: "ID",
        extensions: {},
        gqlInputTypeName
    };
    // Create a copy of the current gqlDefinition and set fields to an empty array
    const newGqlTypeDefinition = JSON.parse(JSON.stringify(gqlTypeDefinition));
    newGqlTypeDefinition.fields = [
        {
            kind: "InputValueDefinition",
            name: {
                kind: "Name",
                value: "id"
            },
            type: {
                kind: "NonNullType",
                type: {
                    kind: "NamedType",
                    name: {
                        kind: "Name",
                        value: "ID"
                    }
                }
            },
            defaultValue: null,
            directives: []
        }
    ];
    newGqlTypeDefinition.name.value = gqlInputTypeName;
    newGqlTypeDefinition.kind = "InputObjectTypeDefinition";
    const localTable = "_local_table_";
    // Create an instance of CreateExpression, to create several used expressions in the context of the current gqlType
    const expressionCreator = new createExpressions_1.CreateExpressions(context.expressions, localTable, true);
    expressionCreator.parseExpressionInput(expressionsInput, true);
    const expressionsObject = expressionCreator.getExpressionsObject();
    const expressions = Object.values(expressionsObject).sort(createExpressions_1.orderExpressions);
    expressions.forEach((expression) => {
        meta.requiresAuth = expression.requiresAuth === true ? true : meta.requiresAuth;
    });
    const viewSql = helpers_1.createView(table, config, mutationName, expressions);
    if (meta.requiresAuth !== true) {
        throw new Error(`Due to security reasons it is not allowed to create DELETE permissions without auth expressions. Look at the permission for type '${gqlTypeName}'.`);
    }
    return {
        gqlDefinitions: [newGqlTypeDefinition],
        meta,
        sql: viewSql
    };
}
exports.buildDeleteView = buildDeleteView;
