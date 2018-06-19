"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createExpressions_1 = require("../createExpressions");
const parseDirectives_1 = require("../utils/parseDirectives");
const helpers_1 = require("./helpers");
function buildUpdateView(table, view, context, extensions, config) {
    // Get some data from table
    const { gqlTypeName, tableName, gqlTypeDefinition } = table;
    const sql = [];
    const mutationName = `${table.gqlTypeName}_UPDATE_${view.name}`.toUpperCase();
    const gqlInputTypeName = mutationName;
    const returnOnlyId = view.returnOnlyId === true ? true : false;
    // Initialize meta object. Required for querybuilder
    const meta = {
        name: mutationName,
        viewSchemaName: config.schemaName,
        viewName: mutationName,
        type: 'UPDATE',
        requiresAuth: false,
        gqlTypeName,
        gqlReturnTypeName: returnOnlyId === true ? 'ID' : gqlTypeName,
        extensions: {},
        gqlInputTypeName
    };
    // Create a copy of the current gqlDefinition and set fields to an empty array
    const newGqlTypeDefinition = JSON.parse(JSON.stringify(gqlTypeDefinition));
    newGqlTypeDefinition.fields = [];
    newGqlTypeDefinition.name.value = gqlInputTypeName;
    newGqlTypeDefinition.kind = 'InputObjectTypeDefinition';
    if (returnOnlyId === true) {
        newGqlTypeDefinition.type = {
            kind: 'NonNullType',
            type: {
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: 'ID',
                }
            }
        };
    }
    // List of field-select sql statements
    const fieldsSql = [];
    const localTable = '_local_table_';
    gqlTypeDefinition.fields.forEach((gqlFieldDefinitionTemp) => {
        const gqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinitionTemp));
        const directives = parseDirectives_1.parseDirectives(gqlFieldDefinition.directives);
        const fieldName = gqlFieldDefinition.name.value;
        gqlFieldDefinition.kind = 'InputValueDefinition';
        const ctx = {
            view,
            gqlFieldDefinition,
            directives,
            fieldName,
            localTable,
            context,
            table
        };
        extensions.some((parser) => {
            if (parser.parseUpdateField != null) {
                const gqlFieldDefinitions = parser.parseUpdateField(ctx);
                if (gqlFieldDefinitions != null && Array.isArray(gqlFieldDefinitions)) {
                    gqlFieldDefinitions.forEach((newGqlFieldDefinition) => {
                        newGqlTypeDefinition.fields.push(newGqlFieldDefinition);
                        fieldsSql.push(`"${localTable}"."${newGqlFieldDefinition.name.value}"`);
                    });
                    return true;
                }
            }
            return false;
        });
    });
    // Create an instance of CreateExpression, to create several used expressions in the context of the current gqlType
    const expressionCreator = new createExpressions_1.CreateExpressions(context.expressions, localTable, true);
    expressionCreator.parseExpressionInput(view.expressions);
    const expressionsObject = expressionCreator.getExpressionsObject();
    const expressions = Object.values(expressionsObject).sort(createExpressions_1.orderExpressions);
    expressions.forEach((expression) => {
        meta.requiresAuth = expression.requiresAuth === true ? true : meta.requiresAuth;
    });
    const viewSql = helpers_1.createView(table, config, mutationName, fieldsSql, expressions);
    if (meta.requiresAuth !== true) {
        throw new Error(`Due to security reasons it is not allowed to create UPDATE permissions ` +
            `without auth expressions. Look at the permission for type '${gqlTypeName}'.`);
    }
    return {
        gqlDefinitions: [newGqlTypeDefinition],
        meta,
        sql: viewSql
    };
}
exports.buildUpdateView = buildUpdateView;
