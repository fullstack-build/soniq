const operationMapper = {
  CREATE: 'INSERT',
  READ: 'SELECT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

export default (dbMeta: any, applicationUserName: any, includePrivileges: any) => {
  const statements = [];
  const viewSchemas = {};

  if (includePrivileges === true) {
    Object.values(dbMeta.schemas).forEach((schema: any) => {
      Object.values(schema.tables).forEach((table: any) => {
        statements.push(`REVOKE ALL PRIVILEGES ON "${table.schemaName}"."${table.name}" FROM ${applicationUserName};`);
      });
    });
  }

  // todo @Dustin: Can be null if relation table was not found
  Object.values(dbMeta.schemas).forEach((schema: any) => {
    Object.values(schema.views).forEach((dbView: any) => {
      let security = '';
      const fieldSelects = dbView.fields.map((field: any) => {
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

  Object.values(viewSchemas).forEach((schemaName: any) => {
    statements.unshift(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  });

  return statements;
};
