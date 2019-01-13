"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseDirectives_1 = require("../utils/parseDirectives");
const getQueryArguments_1 = require("./getQueryArguments");
const helpers_1 = require("./helpers");
const createExpressions_1 = require("../createExpressions");
const defaultFieldCreator_1 = require("./defaultFieldCreator");
function buildReadView(table, readExpressions, context, extensions, config, disableSecurityBarrier) {
    // Get some data from table
    const { gqlTypeName, tableName, gqlTypeDefinition, schemaName } = table;
    // Initialize meta object. Required for querybuilder
    const meta = {
        viewSchemaName: config.schemaName,
        publicViewName: `${tableName.toUpperCase()}_READ_PUBLIC`,
        authViewName: `${tableName.toUpperCase()}_READ_AUTH`,
        publicFieldNames: [],
        authFieldNames: [],
        fields: {},
        tableName,
        tableSchemaName: schemaName
    };
    // Create a copy of the current gqlDefinition and set fields to an empty array
    const newGqlDefinition = JSON.parse(JSON.stringify(gqlTypeDefinition));
    newGqlDefinition.fields = [];
    // List of field-select sql statements
    const publicFieldsSql = [];
    const authFieldsSql = [];
    // The hole view creation. Will be an array
    let publicViewSql = null;
    let authViewSql = null;
    const localTable = "_local_table_";
    // Create an instance of CreateExpression, to create several used expressions in the context of the current gqlType
    const expressionCreator = new createExpressions_1.CreateExpressions(context.expressions, localTable);
    const defaultFieldCreator = new defaultFieldCreator_1.CreateDefaultField(expressionCreator);
    gqlTypeDefinition.fields.forEach((gqlFieldDefinitionTemp) => {
        const gqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinitionTemp));
        const directives = parseDirectives_1.parseDirectives(gqlFieldDefinition.directives);
        const fieldName = gqlFieldDefinition.name.value;
        const ctx = {
            readExpressions,
            gqlFieldDefinition,
            directives,
            expressionCreator,
            defaultFieldCreator,
            fieldName,
            localTable,
            context,
            getQueryArguments: // TODO: Dustin: contect should have a parentContext or permissionContext
            getQueryArguments_1.getQueryArguments,
            table
        };
        extensions.some((parser) => {
            if (parser.parseReadField != null) {
                const results = parser.parseReadField(ctx);
                if (results != null && Array.isArray(results)) {
                    results.forEach((result) => {
                        if (result.gqlFieldDefinition != null) {
                            newGqlDefinition.fields.push(result.gqlFieldDefinition);
                        }
                        const fieldData = {
                            gqlFieldName: result.gqlFieldName,
                            nativeFieldName: result.nativeFieldName,
                            isVirtual: result.isVirtual === true,
                            meta: result.meta
                        };
                        if (result.publicFieldSql != null) {
                            publicFieldsSql.push(result.publicFieldSql);
                            meta.publicFieldNames.push(result.gqlFieldName);
                            if (result.authFieldSql == null) {
                                authFieldsSql.push(result.publicFieldSql);
                                meta.authFieldNames.push(result.gqlFieldName);
                            }
                        }
                        if (result.authFieldSql != null) {
                            authFieldsSql.push(result.authFieldSql);
                            meta.authFieldNames.push(result.gqlFieldName);
                        }
                        meta.fields[result.gqlFieldName] = fieldData;
                    });
                    return true;
                }
            }
            return false;
        });
    });
    const expressionsObject = expressionCreator.getExpressionsObject();
    const authExpressions = Object.values(expressionsObject).sort(createExpressions_1.orderExpressions);
    const publicExpressions = authExpressions.filter((expressionObject) => {
        return expressionObject.requiresAuth !== true;
    });
    authExpressions.forEach((expressionObject) => {
        const gqlFieldDefinition = helpers_1.createGqlField(expressionObject.name, expressionObject.gqlReturnType);
        authFieldsSql.push(`"${expressionObject.name}"."${expressionObject.name}" AS "${expressionObject.name}"`);
        meta.authFieldNames.push(expressionObject.name);
        newGqlDefinition.fields.push(gqlFieldDefinition);
        meta.fields[expressionObject.name] = {
            gqlFieldName: expressionObject.name,
            nativeFieldName: expressionObject.name,
            isVirtual: false,
            meta: null
        };
    });
    publicExpressions.forEach((expressionObject) => {
        publicFieldsSql.push(`"${expressionObject.name}"."${expressionObject.name}" AS "${expressionObject.name}"`);
        meta.publicFieldNames.push(expressionObject.name);
    });
    if (meta.publicFieldNames.length > 0) {
        publicViewSql = helpers_1.createView(table, config, meta.publicViewName, publicFieldsSql, publicExpressions, disableSecurityBarrier);
        // If no view is created, no public fields exist
        if (publicViewSql == null) {
            meta.publicFieldNames = [];
        }
    }
    if (meta.authFieldNames.length > 0) {
        authViewSql = helpers_1.createView(table, config, meta.authViewName, authFieldsSql, authExpressions, disableSecurityBarrier);
    }
    return {
        meta,
        authViewSql,
        publicViewSql,
        gqlDefinition: newGqlDefinition
    };
}
exports.buildReadView = buildReadView;
