import { IAppConfig } from "../moduleDefinition/interfaces";
import { PoolClient } from "pg";
import { IAppMigrationResult, IMigrationResult } from "./interfaces";
import { getSchemas, getTables, getExtensions, getPgSelector } from "./helpers";
import { OPERATION_SORT_POSITION } from "./constants";
import { ICoreMigration, getLatestNMigrations } from "../helpers";

export async function generateCoreMigrations(
  appConfig: IAppConfig,
  pgClient: PoolClient,
  migrationResult: IAppMigrationResult,
  currentVersionHash: string
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
            "version" SERIAL NOT NULL,
            "versionHash" text NOT NULL,
            "appConfig" json NOT NULL,
            "runConfig" json NOT NULL,
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
      latestMigration = (await getLatestNMigrations(pgClient, 1))[0];
    }

    if (
      latestMigration == null ||
      JSON.stringify(latestMigration.runConfig) !== JSON.stringify(migrationResult.runConfig)
    ) {
      migrationResult.commands.push({
        sqls: [
          `INSERT INTO "_core"."Migrations"("versionHash", "appConfig", "runConfig") VALUES('${currentVersionHash}', $SoniqJsonToken$${JSON.stringify(
            appConfig
          )}$SoniqJsonToken$, $SoniqJsonToken$${JSON.stringify(migrationResult.runConfig)}$SoniqJsonToken$);`,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
      });
    }
  }

  return migrationResult;
}
