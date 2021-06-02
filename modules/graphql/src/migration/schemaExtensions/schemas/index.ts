import { ISchemaExtension } from "../ISchemaExtension";
import { IDbSchema } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgSelector } from "../../helpers";

interface IForbiddenSchema {
  schema: string;
  reason: string;
}

const FORBIDDEN_SCHEMAS: IForbiddenSchema[] = [
  {
    schema: "public",
    reason: "The public schema is used by many extensions, which would cause conflicts.",
  },
  {
    schema: "information_schema",
    reason: "The information_schema schema is a postgres-internal schema.",
  },
  {
    schema: "pg_catalog",
    reason: "The pg_catalog schema is a postgres-internal schema.",
  },
];

async function getSchemas(dbClient: PoolClient): Promise<string[]> {
  const { rows } = await dbClient.query(`SELECT schema_name FROM information_schema.schemata;`);

  const schemaNames: string[] = rows.map((row: { schema_name: string }) => {
    return row.schema_name;
  });

  return schemaNames;
}

export const schemaExtensionSchemas: ISchemaExtension = {
  generateCommands: async (schema: IDbSchema, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };

    const sqls: string[] = [];

    const currentSchemaNames: string[] = await getSchemas(dbClient);

    schema.schemas.forEach((schemaName: string) => {
      FORBIDDEN_SCHEMAS.forEach((forbiddenSchema: IForbiddenSchema) => {
        if (forbiddenSchema.schema === schemaName) {
          result.errors.push({
            message: `The schema "${schemaName}" is forbidden: ${forbiddenSchema.reason}`,
          });
        }
      });

      if (currentSchemaNames.indexOf(schemaName) < 0) {
        sqls.push(`CREATE SCHEMA ${getPgSelector(schemaName)};`);
      }
    });

    if (schema.permissionViewSchema != null) {
      FORBIDDEN_SCHEMAS.forEach((forbiddenSchema: IForbiddenSchema) => {
        if (forbiddenSchema.schema === schema.permissionViewSchema) {
          result.errors.push({
            message: `The schema "${schema.permissionViewSchema}" is forbidden: ${forbiddenSchema.reason}`,
          });
        }
      });

      if (currentSchemaNames.indexOf(schema.permissionViewSchema) < 0) {
        sqls.push(`CREATE SCHEMA ${getPgSelector(schema.permissionViewSchema)};`);
      }
    }

    if (sqls.length > 0) {
      result.commands.push({
        sqls,
        description: `Creating Schemas`,
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
      });
    }

    return result;
  },
};
