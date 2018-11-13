"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
function getRelations(dbMeta, relationName, tableName) {
    const relationConnections = dbMeta.relations[relationName];
    const relationConnectionsArray = Object.values(relationConnections);
    const isFirstRelation = relationConnectionsArray[0].tableName === tableName;
    // Determine which relation is the foreign one to get the correct columnName
    const foreignRelation = isFirstRelation !== true ? relationConnectionsArray[0] : relationConnectionsArray[1];
    // Determine which relation is the own one to get the correct columnName
    const ownRelation = isFirstRelation === true ? relationConnectionsArray[0] : relationConnectionsArray[1];
    return {
        ownRelation,
        foreignRelation
    };
}
function parseReadField(ctx) {
    const { fieldName, readExpressions, directives } = ctx;
    // Has field any permission-expression
    if (directives.relation != null && directives.relation.name != null && readExpressions[fieldName] != null) {
        const { gqlFieldDefinition, localTable, defaultFieldCreator, table, getQueryArguments, context } = ctx;
        let newGqlFieldDefinition = JSON.parse(JSON.stringify(gqlFieldDefinition));
        let publicFieldSql = null;
        let authFieldSql = null;
        let nativeFieldName = null;
        const { foreignGqlTypeName, isListType, isNonNullType } = utils_1.getRelationMetasFromDefinition(gqlFieldDefinition);
        const { ownRelation, foreignRelation } = getRelations(context.dbMeta, directives.relation.name, table.tableName);
        const meta = {
            foreignGqlTypeName,
            isListType,
            isNonNullType,
            relationName: directives.relation.name,
            table: {
                gqlTypeName: table.gqlTypeName,
                schemaName: table.schemaName,
                tableName: table.tableName
            }
        };
        if (meta.isListType !== true) {
            nativeFieldName = ownRelation.columnName;
            const columnExpression = `"${localTable}"."${nativeFieldName}"`;
            const result = defaultFieldCreator.create(readExpressions[fieldName], newGqlFieldDefinition, columnExpression, nativeFieldName);
            if (result.publicFieldSql != null) {
                publicFieldSql = result.publicFieldSql;
            }
            if (result.authFieldSql != null) {
                authFieldSql = result.authFieldSql;
            }
            if (result.gqlFieldDefinition != null) {
                newGqlFieldDefinition = result.gqlFieldDefinition;
            }
        }
        else {
            newGqlFieldDefinition.arguments = getQueryArguments(foreignGqlTypeName);
        }
        return [
            {
                gqlFieldName: fieldName,
                nativeFieldName,
                publicFieldSql,
                authFieldSql,
                gqlFieldDefinition: newGqlFieldDefinition,
                meta
            }
        ];
    }
    return null;
}
exports.parseReadField = parseReadField;
function parseUpdateField(ctx) {
    const { view, fieldName, directives } = ctx;
    if (view.fields.indexOf(fieldName) >= 0 && directives.relation != null && directives.relation.name != null) {
        const { gqlFieldDefinition, table, context } = ctx;
        const { foreignGqlTypeName, isListType, isNonNullType } = utils_1.getRelationMetasFromDefinition(gqlFieldDefinition);
        const { ownRelation, foreignRelation } = getRelations(context.dbMeta, directives.relation.name, table.tableName);
        if (ownRelation.columnName != null) {
            if (foreignRelation != null && foreignRelation.type === "MANY" && ownRelation.type === "MANY") {
                // In case of ManyToMany it's an array
                return [utils_1.createIdArrayField(ownRelation.columnName, isNonNullType)];
            }
            else {
                // In case of ManyToOne it is an id
                return [utils_1.createIdField(ownRelation.columnName, isNonNullType)];
            }
        }
        return [];
    }
    return null;
}
exports.parseUpdateField = parseUpdateField;
function parseCreateField(ctx) {
    return parseUpdateField(ctx);
}
exports.parseCreateField = parseCreateField;
