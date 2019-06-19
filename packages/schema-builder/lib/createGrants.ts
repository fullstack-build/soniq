import { IConfig } from "./gql-schema-builder/interfaces";
import { IDbMeta } from ".";

export function createGrants(config: IConfig, dbMeta: IDbMeta): string[] {
  const sql = [];
  sql.push(`REVOKE ALL PRIVILEGES ON DATABASE "${config.databaseName}" FROM "${config.userName}";`);
  sql.push(`CREATE SCHEMA IF NOT EXISTS "${config.schemaName}";`);
  sql.push(`GRANT USAGE ON SCHEMA "_meta" TO "${config.userName}";`);
  sql.push(`GRANT USAGE ON SCHEMA "_auth" TO "${config.userName}";`);
  sql.push(`GRANT USAGE ON SCHEMA "${config.schemaName}" TO "${config.userName}";`);

  // TODO: @Eugene: Move this to versioning.ts
  sql.push(`GRANT USAGE ON SCHEMA "_versions" TO "${config.userName}";`);
  sql.push(`GRANT SELECT ON "_meta".plv8_js_modules TO "${config.userName}";`);

  Object.values(dbMeta.schemas).forEach((schema: any) => {
    Object.values(schema.tables).forEach((table: any) => {
      // sql.push(`REVOKE ALL PRIVILEGES ON "${table.schemaName}"."${table.name}" FROM ${applicationUserName};`);
      sql.push(`GRANT SELECT, UPDATE, INSERT, DELETE ON "${table.schemaName}"."A${table.name}" TO "${config.userName}";`);

      // TODO: @Eugene: Move this to versioning.ts
      // Besides versioning should be a security defining trigger, executed
      // with the permissions of function-creator. Thus this Grant should be removed.
      if (table.extensions != null && table.extensions.versioning != null && table.extensions.versioning.isActive === true) {
        sql.push(`GRANT INSERT ON "_versions"."${table.schemaName}_${table.name}" TO "${config.userName}";`);
      }
    });
  });

  return sql;
}
