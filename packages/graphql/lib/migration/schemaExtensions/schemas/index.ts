import { ISchemaExtension } from "../ISchemaExtension";
import { IDbSchema } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgSelector } from "../../helpers";

const getSchemas = async (dbClient: PoolClient): Promise<string[]> => {
  const { rows } = await dbClient.query(`SELECT schema_name FROM information_schema.schemata;`);

  const schemaNames: string[] = rows.map((row) => {
    return row.schema_name;
  });

  return schemaNames;
};

export const schemaExtensionSchemas: ISchemaExtension = {
  generateCommands: async (schema: IDbSchema, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    const sqls = [];

    const currentSchemaNames = await getSchemas(dbClient);

    schema.schemas.forEach((schemaName) => {
      if (currentSchemaNames.indexOf(schemaName) < 0) {
        sqls.push(`CREATE SCHEMA ${getPgSelector(schemaName)};`);
      }
    });

    if (schema.permissionViewSchema != null && currentSchemaNames.indexOf(schema.permissionViewSchema) < 0) {
      sqls.push(`CREATE SCHEMA ${getPgSelector(schema.permissionViewSchema)};`);
    }

    if (sqls.length > 0) {
      result.commands.push({
        sqls,
        description: `Creating Schemas`,
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA
      });
    }

    return result;
  }
};
