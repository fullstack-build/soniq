"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function filterBooleanExpressions(expressionObject) {
    return expressionObject.gqlReturnType === 'Boolean';
}
function createExpressionSql(expressionObject) {
    if (expressionObject.type === 'function') {
        return `${expressionObject.sql} AS "${expressionObject.name}"`;
    }
    if (expressionObject.requiresLateral) {
        return `LATERAL (SELECT ${expressionObject.sql} AS "${expressionObject.name}") AS "${expressionObject.name}"`;
    }
    return `(SELECT ${expressionObject.sql} AS "${expressionObject.name}") AS "${expressionObject.name}"`;
}
function getExpressionName(expressionObject) {
    return `"${expressionObject.name}"`;
}
function createView(table, config, name, fields, expressions) {
    const statements = [];
    statements.push(`DROP VIEW IF EXISTS "${config.schemaName}"."${name}";`);
    let sql = `CREATE OR REPLACE VIEW "${config.schemaName}"."${name}" WITH (security_barrier) AS `;
    sql += `SELECT ${fields.join(', ')} FROM "${table.schemaName}"."${table.tableName}" AS "_local_table_"`;
    if (expressions.length > 0) {
        sql += `, ${expressions.map(createExpressionSql).join(', ')}`;
    }
    const conditionExpressions = expressions.filter(filterBooleanExpressions);
    if (conditionExpressions.length > 0) {
        sql += ` WHERE ${conditionExpressions.map(getExpressionName).join(' OR ')}`;
    }
    sql += ';';
    statements.push(sql);
    statements.push(`GRANT SELECT ON "${config.schemaName}"."${name}" TO ${config.userName};`);
    return statements;
}
exports.createView = createView;
function createGqlField(name, gqlReturnType) {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        arguments: [],
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: gqlReturnType
            }
        },
        directives: []
    };
}
exports.createGqlField = createGqlField;
