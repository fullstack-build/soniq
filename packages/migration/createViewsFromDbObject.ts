
const operationMapper = {
  CREATE: 'INSERT',
  READ: 'SELECT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

export default (dbObject, applicationUserName, includePrivileges) => {
  const statements = [];
  const viewSchemas = {};
  statements.push('-- views');

  if (includePrivileges === true) {
    Object.values(dbObject.schemas).forEach((schema) => {
      Object.values(schema.tables).forEach((table) => {
        statements.push(`REVOKE ALL PRIVILEGES ON "${table.schemaName}"."${table.name}" FROM ${applicationUserName};`);
      });
    });
  }

  // todo @Dustin: Can be null if relation table was not found
  Object.values(dbObject.views).forEach((view) => {
    let security = '';
    const fieldSelects = view.fields.map((field) => {
      return field.expression;
    });

    if (view.operation === 'READ') {
      security = ' WITH (security_barrier)';
    }

    viewSchemas[view.viewSchemaName] = view.viewSchemaName;

    statements.push(`DROP VIEW IF EXISTS "${view.viewSchemaName}"."${view.viewName}";`);
    // tslint:disable-next-line:max-line-length
    statements.push(`CREATE VIEW "${view.viewSchemaName}"."${view.viewName}"${security} AS SELECT ${fieldSelects.join(', ')} FROM "${view.schemaName}"."${view.tableName}" WHERE ${view.expressions.join(' OR ')};`);

    if (includePrivileges === true) {
      statements.push(`REVOKE ALL PRIVILEGES ON "${view.name}" FROM ${applicationUserName};`);
      statements.push(`GRANT ${operationMapper[view.operation]} ON "${view.name}" TO ${applicationUserName};`);
    }
  });

  Object.values(viewSchemas).forEach((schemaName) => {
    statements.unshift(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  });

  return statements;
};
