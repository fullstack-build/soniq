"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createView_1 = require("./createView");
const createQuery_1 = require("./createQuery");
const getFilterDefinitions_1 = require("./getFilterDefinitions");
function buildReadQuery(table, readExpressions, context, extensions, config) {
    const gqlDefinitions = [];
    const sql = [];
    const queryName = `${table.gqlTypeName.toLowerCase()}s`;
    const orderByEnumName = `${table.gqlTypeName}OrderBy`;
    const whereFilterName = `${table.gqlTypeName}Filter`;
    let viewCreated = false;
    const { meta, authViewSql, publicViewSql, gqlDefinition } = createView_1.buildReadView(table, readExpressions, context, extensions, config);
    if (authViewSql != null) {
        authViewSql.forEach(q => sql.push(q));
        viewCreated = true;
    }
    if (publicViewSql != null) {
        publicViewSql.forEach(q => sql.push(q));
        viewCreated = true;
    }
    if (viewCreated === true && gqlDefinition != null) {
        gqlDefinitions.push(gqlDefinition);
        gqlDefinitions.push(createQuery_1.createQuery(queryName, table.gqlTypeName));
    }
    const nativeFieldNames = Object.values(meta.fields)
        .filter((field) => field.nativeFieldName != null && field.isVirtual !== true)
        .map((field) => field.nativeFieldName);
    getFilterDefinitions_1.getFilterDefinitions(nativeFieldNames, orderByEnumName, whereFilterName).forEach(d => gqlDefinitions.push(d));
    return {
        gqlDefinitions,
        meta,
        sql
    };
}
exports.buildReadQuery = buildReadQuery;
