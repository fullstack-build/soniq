import { registerQueryParser, registerColumnMigrationExtension, splitActionFromNode } from "@fullstack-one/schema-builder";

// helper
const ACTION_KEY: string = "$$action$$";
function _splitActionFromNode(node: {} = {}): { action: any; node: any } {
  return splitActionFromNode(ACTION_KEY, node);
}

// GQl AST
// add directive parser
export function setDirectiveParser(registerDirectiveParser) {
  // Auth directives
  registerDirectiveParser("auth", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    setAuthValueForColumn(directiveKind, gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
  });
  registerDirectiveParser("tenant", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    setAuthValueForColumn(directiveKind, gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
  });
  registerDirectiveParser("username", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    setAuthValueForColumn(directiveKind, gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
  });
  registerDirectiveParser("password", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    setAuthValueForColumn(directiveKind, gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
  });

  function setAuthValueForColumn(directiveKind, gQlSchemaNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) {
    const directiveKindLowerCase = directiveKind.toLowerCase();

    let pathToDirective = "";
    if (refDbMetaCurrentTable != null && refDbMetaCurrentTable.name) {
      pathToDirective = refDbMetaCurrentTable.name;
    }
    if (refDbMetaCurrentTableColumn != null && refDbMetaCurrentTableColumn.name) {
      pathToDirective += `.${refDbMetaCurrentTableColumn.name}`;
    }
    if (directiveKindLowerCase === "auth") {
      // check if other tables were marked already
      // collect all tables from all schemas
      const allTables: any = Object.values(refDbMeta.schemas).reduce((result: any, schema: any) => [...result, ...Object.values(schema.tables)], []);

      const markedAuthTables = allTables.filter((table) => table.extensions.isAuth);
      if (markedAuthTables.length === 0) {
        // set table to auth
        refDbMetaCurrentTable.extensions.isAuth = true;
      } else {
        // other table was marked already
        process.stderr.write(`GraphQL.parser.error.table.auth.multiple.tables: ${pathToDirective}.${directiveKind}\n`);
      }
    } else {
      // mark field

      // only possible on tables that were marked as auth
      if (refDbMetaCurrentTable.extensions.isAuth) {
        // only one attribute per field is possible
        if (dbMetaNode.extensions.auth == null) {
          // add marked different types
          switch (directiveKindLowerCase) {
            case "tenant":
              // check if other columns were already marked same marker
              const columnMarkedTenant = Object.values(refDbMetaCurrentTable.columns).filter(
                (column: any) => column.extensions.auth && column.extensions.auth.isTenant
              );

              if (columnMarkedTenant.length === 0) {
                dbMetaNode.extensions.auth = {
                  isTenant: true
                };
              } else {
                // multiple columns marked with same marker
                process.stderr.write(`GraphQL.parser.error.table.auth.multiple.columns: ${pathToDirective}.${directiveKind}\n`);
              }

              break;
            case "username":
              // check if other columns were already marked same marker
              const columnMarkedUsername = Object.values(refDbMetaCurrentTable.columns).filter(
                (column: any) => column.extensions.auth && column.extensions.auth.isUsername
              );
              if (columnMarkedUsername.length === 0) {
                dbMetaNode.extensions.auth = {
                  isUsername: true
                };
              } else {
                // multiple columns marked with same marker
                process.stderr.write(`GraphQL.parser.error.table.auth.multiple.columns: ${pathToDirective}.${directiveKind}\n`);
              }
              break;
            case "password":
              // check if other columns were already marked same marker
              const columnMarkedPassword = Object.values(refDbMetaCurrentTable.columns).filter(
                (column: any) => column.extensions.auth && column.extensions.auth.isPassword
              );
              if (columnMarkedPassword.length === 0) {
                // mark as password
                dbMetaNode.extensions.auth = {
                  isPassword: true
                };
                // set type to json
                dbMetaNode.type = "jsonb";
              } else {
                // multiple columns marked with same marker
                process.stderr.write(`GraphQL.parser.error.table.auth.multiple.columns: ${pathToDirective}.${directiveKind}\n`);
              }
              break;
          }
        } else {
          process.stderr.write(`GraphQL.parser.error.table.auth.multiple.properties: ${pathToDirective}.${directiveKind}\n`);
        }
      } else {
        process.stderr.write(`GraphQL.parser.error.table.auth.missing: ${pathToDirective}.${directiveKind}\n`);
      }
    }
  }
}

// query parser
registerQueryParser(async (dbClient, dbMeta) => {
  try {
    const { rows } = await dbClient.pgClient.query(
      `SELECT * FROM _meta."Auth" WHERE key IN
        ('auth_table_schema', 'auth_table', 'auth_field_username', 'auth_field_password', 'auth_field_tenant');`
    );
    const authObj = rows.reduce((result, row) => {
      result[row.key] = row.value;
      return result;
    }, {});

    // get relevant table
    const thisTable = dbMeta.schemas[authObj.auth_table_schema].tables[authObj.auth_table];
    // mark table as auth
    thisTable.extensions.isAuth = true;
    // set username
    if (authObj.auth_field_username != null) {
      thisTable.columns[authObj.auth_field_username].extensions.auth = {
        isUsername: true
      };
    }
    // set password
    if (authObj.auth_field_password != null) {
      thisTable.columns[authObj.auth_field_password].extensions.auth = {
        isPassword: true
      };
    }
    // set tenant
    if (authObj.auth_field_tenant != null) {
      thisTable.columns[authObj.auth_field_tenant].extensions.auth = {
        isTenant: true
      };
    }
  } catch (err) {
    // ignore error in case settings -> not set up yet
  }
});

// Migration SQL
// column
registerColumnMigrationExtension("auth", (extensionDefinitionWithAction, sqlMigrationObj, nodeSqlObj, schemaName, tableName, columnName) => {
  // create CRUD section, set ref and keep ref for later
  const thisSqlObj = (sqlMigrationObj.crud = sqlMigrationObj.crud || {
    sql: {
      up: [],
      down: []
    }
  }).sql;

  const authNodeObj = _splitActionFromNode(extensionDefinitionWithAction);
  const authNodeAction = authNodeObj.action;
  const authNodeDefinition = authNodeObj.node;

  // in case of a change, multiple can happen at the same time -> no else if/switch
  // set username and table information
  if (authNodeDefinition.isUsername) {
    if (authNodeAction.remove) {
      // down
      thisSqlObj.down.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table_schema', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`
      );
      thisSqlObj.down.push(`INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`);
      thisSqlObj.down.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_username', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`
      );
    } else {
      // up
      thisSqlObj.up.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table_schema', '${schemaName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${schemaName}';`
      );
      thisSqlObj.up.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_table', '${tableName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${tableName}';`
      );
      thisSqlObj.up.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_username', '${columnName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${columnName}';`
      );
    }
  }

  // password
  if (authNodeDefinition.isPassword) {
    if (authNodeAction.remove) {
      thisSqlObj.down.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_password', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`
      );
    } else {
      thisSqlObj.up.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_password', '${columnName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${columnName}';`
      );
    }
  }

  // tenant
  if (authNodeDefinition.isTenant) {
    if (authNodeAction.remove) {
      thisSqlObj.down.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_tenant', NULL) ON CONFLICT ("key") DO UPDATE SET "value"=NULL;`
      );
    } else {
      thisSqlObj.up.push(
        `INSERT INTO _meta."Auth" ("key", "value") VALUES('auth_field_tenant', '${columnName}') ` +
          `ON CONFLICT ("key") DO UPDATE SET "value"='${columnName}';`
      );
    }
  }
});
