"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseField(field, ctx) {
    const fieldName = field.name.value;
    const gqlTypeName = ctx.view.gqlTypeName;
    const viewName = ctx.view.viewName;
    const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;
    if (!isIncluded) {
        return false;
    }
    if (ctx.gQlTypes[gqlTypeName].fieldNames.indexOf(fieldName) < 0) {
        ctx.gQlTypes[gqlTypeName].fieldNames.push(fieldName);
    }
    ctx.dbView.fields.push({
        name: fieldName,
        expression: `"${fieldName}"`
    });
    ctx.gQlTypes[gqlTypeName].views[viewName].nativeFieldNames.push(fieldName);
    ctx.tableView.fields.push(field);
    return true;
}
exports.parseField = parseField;
