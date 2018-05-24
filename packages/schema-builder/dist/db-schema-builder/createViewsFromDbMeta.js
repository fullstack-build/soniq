"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operationMapper = {
    CREATE: 'INSERT',
    READ: 'SELECT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};
exports.default = (dbMeta, applicationUserName, includePrivileges) => {
    const statements = [];
    const viewSchemas = {};
    if (dbMeta.schemas == null) {
        return statements;
    }
    if (includePrivileges === true) {
        Object.values(dbMeta.schemas).forEach((schema) => {
            Object.values(schema.tables).forEach((table) => {
                statements.push(`REVOKE ALL PRIVILEGES ON "${table.schemaName}"."${table.name}" FROM ${applicationUserName};`);
            });
        });
    }
    Object.values(dbMeta.schemas).forEach((schema) => {
        Object.values(schema.views).forEach((dbView) => {
            let security = '';
            const fieldSelects = dbView.fields.map((field) => {
                return field.expression;
            });
            if (dbView.operation === 'READ') {
                security = ' WITH (security_barrier)';
            }
            viewSchemas[dbView.viewSchemaName] = dbView.viewSchemaName;
            statements.push(`DROP VIEW IF EXISTS "${dbView.viewSchemaName}"."${dbView.viewName}";`);
            // tslint:disable-next-line:max-line-length
            statements.push(`CREATE VIEW "${dbView.viewSchemaName}"."${dbView.viewName}"${security} AS SELECT ${fieldSelects.join(', ')} FROM "${dbView.schemaName}"."${dbView.tableName}" WHERE ${dbView.expressions.join(' OR ')};`);
            if (includePrivileges === true) {
                statements.push(`REVOKE ALL PRIVILEGES ON "${dbView.name}" FROM ${applicationUserName};`);
                statements.push(`GRANT ${operationMapper[dbView.operation]} ON "${dbView.name}" TO ${applicationUserName};`);
            }
        });
    });
    Object.values(viewSchemas).forEach((schemaName) => {
        statements.unshift(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    });
    return statements;
};
