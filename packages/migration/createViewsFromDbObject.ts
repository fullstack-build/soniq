
const operationMapper = {
  CREATE: 'INSERT',
  READ: 'SELECT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

export default (dbObject, applicationUserName, includePrivileges) => {
  const statements = [];

  if (includePrivileges === true) {
    Object.values(dbObject.tables).forEach((table) => {
      if (table.isDbModel === true) {
        statements.push(`REVOKE ALL PRIVILEGES ON "${table.name}" FROM ${applicationUserName};`);
      }
    });
  }

  Object.values(dbObject.views).forEach((view) => {
    let security = '';
    const fieldSelects = view.fields.map((field) => {
      return field.expression;
    });

    if (view.operation === 'READ') {
      security = ' WITH (security_barrier)';
    }

    statements.push(`DROP VIEW IF EXISTS "${view.name}";`);
    // tslint:disable-next-line:max-line-length
    statements.push(`CREATE VIEW "${view.name}"${security} AS SELECT ${fieldSelects.join(', ')} FROM "${view.tableName}" WHERE ${view.expressions.join(' OR ')};`);

    if (includePrivileges === true) {
      statements.push(`REVOKE ALL PRIVILEGES ON "${view.name}" FROM ${applicationUserName};`);
      statements.push(`GRANT ${operationMapper[view.operation]} ON "${view.name}" TO ${applicationUserName};`);
    }
  });

  return statements;
};
