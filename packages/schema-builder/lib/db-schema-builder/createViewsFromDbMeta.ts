const operationMapper = {
  CREATE: "INSERT",
  READ: "SELECT",
  UPDATE: "SELECT, UPDATE",
  DELETE: "SELECT, DELETE"
};

export default (dbMeta: any, databaseName: any, applicationUserName: any, includePrivileges: any) => {
  const statements = [];
  const viewSchemas = {};

  if (dbMeta.schemas == null) {
    return statements;
  }

  if (includePrivileges === true) {
    statements.push(`REVOKE ALL PRIVILEGES ON DATABASE "${databaseName}" FROM ${applicationUserName};`);
    statements.push(`GRANT USAGE ON SCHEMA "_meta" TO ${applicationUserName};`);

    // TODO: @Eugene: Move this to versioning.ts
    statements.push(`GRANT USAGE ON SCHEMA "_versions" TO ${applicationUserName};`);
    statements.push(`GRANT SELECT ON "_meta".plv8_js_modules TO ${applicationUserName};`);

    Object.values(dbMeta.schemas).forEach((schema: any) => {
      Object.values(schema.tables).forEach((table: any) => {
        // statements.push(`REVOKE ALL PRIVILEGES ON "${table.schemaName}"."${table.name}" FROM ${applicationUserName};`);
        statements.push(`GRANT SELECT, UPDATE, INSERT, DELETE ON "${table.schemaName}"."A${table.name}" TO ${applicationUserName};`);

        // TODO: @Eugene: Move this to versioning.ts
        statements.push(`GRANT INSERT ON "_versions"."${table.schemaName}_${table.name}" TO ${applicationUserName};`);
      });
    });
  }

  Object.keys(dbMeta.schemas).forEach((schemaName: any) => {
    const schema = dbMeta.schemas[schemaName];
    if (includePrivileges === true) {
      statements.push(`GRANT USAGE ON SCHEMA "${schemaName}" TO ${applicationUserName};`);
    }
    Object.values(schema.views).forEach((dbView: any) => {
      let security = "";
      let checkOption = "";
      const fieldSelects = dbView.fields.map((field: any) => {
        return field.expression;
      });

      if (true || dbView.operation === "READ") {
        security = " WITH (security_barrier)";
      }

      if (dbView.operation === "CREATE") {
        checkOption = " WITH LOCAL CHECK OPTION";
      }

      viewSchemas[dbView.viewSchemaName] = dbView.viewSchemaName;

      // remove and recreate view
      statements.push(`DROP VIEW IF EXISTS "${dbView.viewSchemaName}"."${dbView.viewName}";`);
      statements.push(`CREATE VIEW "${dbView.viewSchemaName}"."${dbView.viewName}"${security}
      AS SELECT ${fieldSelects.join(", ")} FROM "${dbView.schemaName}"."${dbView.tableName}"
      WHERE ${dbView.expressions.join(" OR ")}${checkOption};`);

      if (includePrivileges === true) {
        // statements.push(`REVOKE ALL PRIVILEGES ON "${dbView.name}" FROM ${applicationUserName};`);
        statements.push(`GRANT ${operationMapper[dbView.operation]} ON "${dbView.viewSchemaName}"."${dbView.viewName}" TO ${applicationUserName};`);
      }
    });
  });

  Object.values(viewSchemas).forEach((schemaName: any) => {
    statements.unshift(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  });

  return statements;
};
