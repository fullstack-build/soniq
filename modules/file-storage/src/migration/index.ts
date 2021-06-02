/* eslint-disable @typescript-eslint/naming-convention */
import { generateFileStorageSchema } from "./basic";
import { GraphQl, IDbSchema, Migration } from "@soniq/graphql";
import { PoolClient, OPERATION_SORT_POSITION, IModuleMigrationResult } from "soniq";
import { IFileStorageAppConfig } from "../moduleDefinition/interfaces";
import { getCurrentSettings, ISettings } from "./helpers";

export async function migrate(
  graphQl: GraphQl,
  appConfig: IFileStorageAppConfig,
  pgClient: PoolClient
): Promise<IModuleMigrationResult> {
  const fileStorageSchema: IDbSchema = await generateFileStorageSchema();

  const gqlMigration: Migration = graphQl.getMigration();

  const result: IModuleMigrationResult = await gqlMigration.generateSchemaMigrationCommands(
    fileStorageSchema,
    pgClient
  );

  const currentSettings: ISettings = await getCurrentSettings(pgClient);
  const sqls: string[] = [];

  const pgConfig: ISettings = {
    max_temp_files_per_user: appConfig.maxTempFilesPerUser.toString(),
  };

  Object.keys(pgConfig).forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(
        `INSERT INTO _file_storage."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${pgConfig[key]}$tok$);`
      );
    } else {
      if (pgConfig[key] != null && pgConfig[key] !== currentSettings[key]) {
        sqls.push(
          `UPDATE _file_storage."Settings" SET "value"=$tok$${pgConfig[key]}$tok$ WHERE "key"=$tok$${key}$tok$;`
        );
      }
    }
  });

  if (sqls.length > 0) {
    result.commands.push({
      sqls,
      operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
    });
  }

  result.moduleRunConfig = {};

  return result;
}
