import { IAppConfig } from "../interfaces";
import { PoolClient } from "pg";
import { IAppMigrationResult, IMigrationResult } from "./interfaces";
import { getSchemas, getTables, getExtensions, getPgSelector } from "./helpers";
import { OPERATION_SORT_POSITION } from "./constants";
import { ICoreMigration, getLatestMigrationVersion } from "../helpers";

export async function generateCoreMigrations(
  version: number,
  appConfig: IAppConfig,
  pgClient: PoolClient,
  migrationResult: IAppMigrationResult
): Promise<IMigrationResult> {
  const currentSchemaNames: string[] = await getSchemas(pgClient);
  const currentTableNames: string[] = await getTables(pgClient, ["_core"]);
  const currentExtensionNames: string[] = await getExtensions(pgClient);

  if (currentSchemaNames.indexOf("_core") < 0) {
    migrationResult.commands.push({
      sqls: [`CREATE SCHEMA ${getPgSelector("_core")};`],
      operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
    });
  }

  if (currentExtensionNames.indexOf("uuid-ossp") < 0) {
    migrationResult.commands.push({
      sqls: [`CREATE EXTENSION ${getPgSelector("uuid-ossp")};`],
      operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
    });
  }

  if (currentExtensionNames.indexOf("pgcrypto") < 0) {
    migrationResult.commands.push({
      sqls: [`CREATE EXTENSION ${getPgSelector("pgcrypto")};`],
      operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
    });
  }

  if (currentExtensionNames.indexOf("plv8") < 0) {
    migrationResult.commands.push({
      sqls: [`CREATE EXTENSION ${getPgSelector("plv8")};`],
      operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
    });
  }

  if (currentTableNames.indexOf("Migrations") < 0) {
    migrationResult.commands.push({
      sqls: [
        `
          CREATE TABLE "_core"."Migrations" (
            "id" uuid DEFAULT uuid_generate_v4(),
            "version" integer NOT NULL,
            "appConfig" json NOT NULL,
            "runtimeConfig" json NOT NULL,
            "createdAt" timestamp without time zone NOT NULL DEFAULT timezone('UTC'::text, now()),
            PRIMARY KEY ("id"),
            UNIQUE ("version")
          );
          `,
      ],
      operationSortPosition: OPERATION_SORT_POSITION.CREATE_TABLE,
    });
  }

  if (migrationResult.errors.length === 0) {
    let latestMigration: ICoreMigration | null = null;

    if (currentTableNames.indexOf("Migrations") >= 0) {
      latestMigration = await getLatestMigrationVersion(pgClient);
    }
    // .replace(new RegExp("'", "g"), "\\'")

    if (
      latestMigration == null ||
      JSON.stringify(latestMigration.runtimeConfig) !== JSON.stringify(migrationResult.runtimeConfig) ||
      migrationResult.commands.length > 0
    ) {
      console.log(
        "REDO",
        latestMigration == null,
        latestMigration != null &&
          JSON.stringify(latestMigration.runtimeConfig) !== JSON.stringify(migrationResult.runtimeConfig),
        migrationResult.commands.length > 0
      );
      // console.log("A", JSON.stringify(latestMigration?.runtimeConfig));
      // console.log("B", JSON.stringify(migrationResult.runtimeConfig));
      migrationResult.commands.push({
        sqls: [
          `INSERT INTO "_core"."Migrations"("version", "appConfig", "runtimeConfig") VALUES('${version}', $SoniqJsonToken$${JSON.stringify(
            appConfig
          )}$SoniqJsonToken$, $SoniqJsonToken$${JSON.stringify(migrationResult.runtimeConfig)}$SoniqJsonToken$);`,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
      });
    }
  }

  return migrationResult;
}
