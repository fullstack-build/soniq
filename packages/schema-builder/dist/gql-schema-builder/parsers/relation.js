"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findDirectiveIndex_1 = require("../utils/findDirectiveIndex");
const getArgumentByName_1 = require("../utils/getArgumentByName");
const getRelationForeignGqlTypeName_1 = require("../utils/getRelationForeignGqlTypeName");
const createIdArrayField_1 = require("../utils/createIdArrayField");
const createIdField_1 = require("../utils/createIdField");
const getQueryArguments_1 = require("../utils/getQueryArguments");
function parseField(field, ctx) {
    const fieldName = field.name.value;
    const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;
    if (!isIncluded) {
        return false;
    }
    const relationDirectiveIndex = findDirectiveIndex_1.default(field, 'relation');
    // field is relation
    if (relationDirectiveIndex < 0) {
        return false;
    }
    const relationDirective = field.directives[relationDirectiveIndex];
    const gqlTypeName = ctx.view.gqlTypeName;
    const viewName = ctx.view.viewName;
    const tableName = ctx.view.tableName;
    if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
        ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
    }
    const relationName = getArgumentByName_1.default(relationDirective, 'name').value.value;
    const relationConnections = ctx.dbObject.relations[relationName];
    const relationConnectionsArray = Object.values(relationConnections);
    // Determine which relation is the foreign one to get the correct columnName
    const foreignRelation = relationConnectionsArray[0].tableName === tableName ? relationConnectionsArray[1] : relationConnectionsArray[0];
    // Determine which relation is the own one to get the correct columnName
    const ownRelation = relationConnectionsArray[0].tableName === tableName ? relationConnectionsArray[0] : relationConnectionsArray[1];
    const relationFieldName = fieldName + 'Id';
    const foreignGqlTypeName = getRelationForeignGqlTypeName_1.default(field);
    const foreignNativeTable = ctx.dbObject.exposedNames[foreignGqlTypeName];
    if (foreignNativeTable == null) {
        throw new Error(`Unable to find database table for name GraphQL type name '${foreignGqlTypeName}'.`);
    }
    ctx.gQlTypes[gqlTypeName].relationByField[fieldName] = {
        relationName,
        foreignGqlTypeName,
        foreignTableName: foreignNativeTable.tableName,
        foreignSchemaName: foreignNativeTable.schemaName,
        relationType: ownRelation.type,
        columnName: relationFieldName
    };
    if (ownRelation.columnName != null) {
        ctx.dbView.fields.push({
            name: fieldName,
            expression: `"${ownRelation.columnName}"`
        });
        if (ctx.view.type !== 'READ') {
            // Add relation-field-name to GQL Input for mutating it
            if (foreignRelation.type === 'MANY' && ownRelation.type === 'MANY') {
                // In case of ManyToMany it's an array
                ctx.tableView.fields.push(createIdArrayField_1.default(ownRelation.columnName));
            }
            else {
                // In case of ManyToOne it is an id
                ctx.tableView.fields.push(createIdField_1.default(ownRelation.columnName));
            }
        }
        ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(ownRelation.columnName);
    }
    // This field cannot be set with a mutation
    if (ctx.view.type === 'READ') {
        const foreignTypesEnumName = (foreignNativeTable.tableName + '_VIEWS').toUpperCase();
        field.arguments = getQueryArguments_1.default(foreignTypesEnumName);
        ctx.tableView.fields.push(field);
    }
    return true;
}
exports.parseField = parseField;
