"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createScalar_1 = require("../utils/createScalar");
const findDirectiveIndex_1 = require("../utils/findDirectiveIndex");
const getJsonObjectBuilderExpression_1 = require("../utils/getJsonObjectBuilderExpression");
const lodash_1 = require("lodash");
const JSON_SPLIT = '.';
function init(graphQlDocument) {
    graphQlDocument.definitions.push(createScalar_1.default('JSON'));
}
exports.init = init;
function parseField(field, ctx) {
    const fieldName = field.name.value;
    const gqlTypeName = ctx.view.gqlTypeName;
    const viewName = ctx.view.viewName;
    const tableName = ctx.view.tableName;
    const jsonDirectiveIndex = findDirectiveIndex_1.default(field, 'json');
    if (jsonDirectiveIndex < 0) {
        return false;
    }
    if (ctx.view.type === 'READ') {
        const jsonFields = {};
        Object.values(ctx.view.fields).forEach((viewFieldName) => {
            if (viewFieldName.startsWith(`${fieldName}${JSON_SPLIT}`)) {
                if (jsonFields[fieldName] == null) {
                    jsonFields[fieldName] = [];
                }
                jsonFields[fieldName].push(viewFieldName);
            }
        });
        if (jsonFields[fieldName] != null) {
            jsonFields[fieldName].sort((a, b) => {
                if (a.split(JSON_SPLIT).length > b.split(JSON_SPLIT).length) {
                    return -1;
                }
                if (a.split(JSON_SPLIT).length < b.split(JSON_SPLIT).length) {
                    return 1;
                }
                return 0;
            });
            const matchObject = {};
            Object.values(jsonFields[fieldName]).forEach((viewFieldName) => {
                lodash_1._.set(matchObject, viewFieldName, true);
            });
            const jsonExpression = getJsonObjectBuilderExpression_1.default(matchObject, fieldName, tableName);
            if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
                ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
            }
            ctx.dbView.fields.push({
                name: fieldName,
                expression: jsonExpression
            });
            if (ctx.gQlTypes[gqlTypeName].views[viewName].jsonFieldNames == null) {
                ctx.gQlTypes[gqlTypeName].views[viewName].jsonFieldNames = [];
            }
            ctx.gQlTypes[gqlTypeName].views[viewName].jsonFieldNames.push(fieldName);
            ctx.tableView.fields.push(field);
            return true;
        }
    }
    else {
        if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
            ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
        }
        field.type.name.value = field.type.name.value + 'Input';
        ctx.dbView.fields.push({
            name: fieldName,
            expression: `"${fieldName}"`
        });
        ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);
        ctx.tableView.fields.push(field);
        return true;
    }
}
exports.parseField = parseField;
