"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_builder_1 = require("@fullstack-one/schema-builder");
const { findDirectiveIndex, getArgumentByName, parseDirectiveArguments, createArrayField, getEnum } = schema_builder_1.utils;
const typesEnumName = 'FILE_TYPES';
function parseField(field, ctx) {
    const fieldName = field.name.value;
    const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;
    if (!isIncluded) {
        return false;
    }
    const filesDirectiveIndex = findDirectiveIndex(field, 'files');
    // field is not custom
    if (filesDirectiveIndex < 0) {
        return false;
    }
    const gqlTypeName = ctx.view.gqlTypeName;
    const viewName = ctx.view.viewName;
    const tableName = ctx.view.tableName;
    const fileDirective = field.directives[filesDirectiveIndex];
    if (ctx.parserCache.fileStorage == null) {
        ctx.parserCache.fileStorage = {
            typesObject: {}
        };
    }
    const resolverName = '@fullstack-one/file-storage/readFiles';
    const directiveArguments = parseDirectiveArguments(fileDirective);
    const params = directiveArguments.params || {};
    const types = directiveArguments.types || ['DEFAULT'];
    types.forEach((type) => {
        ctx.parserCache.fileStorage.typesObject[type] = true;
    });
    const fieldKey = `${gqlTypeName}_${fieldName}`;
    // Add field to custom fields for resolving it seperate
    ctx.customFields[fieldKey] = {
        type: 'Field',
        gqlTypeName,
        fieldName,
        resolver: resolverName,
        params
    };
    if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
        ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
    }
    ctx.dbView.fields.push({
        name: fieldName,
        expression: `"${fieldName}"`
    });
    // Add native fields to gQlTypes
    ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);
    const description = {
        kind: 'StringValue',
        value: `Allowed types: [${types.map(type => `"${type}"`).join(', ')}]`,
        block: true
    };
    // This field cannot be set with a generated mutation
    if (ctx.view.type !== 'READ') {
        const arrayField = createArrayField(fieldName, 'String');
        description.value = `List of FileNames. ${description.value}`;
        arrayField.description = description;
        ctx.tableView.fields.push(arrayField);
    }
    else {
        field.description = description;
        description.value = `List of Files. ${description.value}`;
        ctx.tableView.fields.push(field);
    }
    return true;
}
exports.parseField = parseField;
function finish(ctx) {
    if (ctx.parserCache.fileStorage != null) {
        const types = Object.keys(ctx.parserCache.fileStorage.typesObject);
        ctx.graphQlDocument.definitions.push(getEnum(typesEnumName, types));
    }
}
exports.finish = finish;
