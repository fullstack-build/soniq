import { IDbSchema, IHelpers, IGqlMigrationResult } from "@fullstack-one/graphql";
import { PoolClient, getPgSelector, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { getFileColumns, IFileColumn, getTriggers } from "./queryHelper";
import * as uuidv4 from "uuid/v4";

export const postProcessingExtensionFile = {
  generateCommands: async (
    schema: IDbSchema,
    pgClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: any,
    result: IGqlMigrationResult
  ): Promise<IGqlMigrationResult> => {
    const fileColumns: IFileColumn[] = gqlMigrationContext.fileStorageColumns || [];
    const existingFileColumns = await getFileColumns(pgClient, schema.schemas);
    const existingTriggers = await getTriggers(pgClient, schema.schemas);
    const tableTriggers: {[tableKey: string]: {schemaName: string, tableName: string}} = {};
    const sqls = [];

    // Find new and changed fileColumns to update or insert
    fileColumns.forEach((fileColumn) => {
      let isExisting = false;
      let updateId = null;
      existingFileColumns.forEach((existingFileColumn) => {
        if (fileColumn.schemaName === existingFileColumn.schemaName && fileColumn.tableName === existingFileColumn.tableName && fileColumn.columnName === existingFileColumn.columnName) {
          isExisting = true;
          if (JSON.stringify(fileColumn.types) !== JSON.stringify(existingFileColumn.types)) {
            updateId = existingFileColumn.id;
          }
        }
      });

      if (isExisting === false) {
        sqls.push(`INSERT INTO _file_storage."Columns"("schemaName", "tableName", "columnName", "types") VALUES($tok$${fileColumn.schemaName}$tok$, $tok$${fileColumn.tableName}$tok$, $tok$${fileColumn.columnName}$tok$, $tok$${JSON.stringify(fileColumn.types)}$tok$);`);
      } else {
        if (updateId != null) {
          sqls.push(`UPDATE "_file_storage"."Columns" SET "types"=$tok$${JSON.stringify(fileColumn.types)}$tok$ WHERE "id"='${updateId}';`);
        }
      }

      const tableKey = `${fileColumn.schemaName}.${fileColumn.tableName}`;
      if (tableTriggers[tableKey] == null) {
        tableTriggers[tableKey] = {
          schemaName: fileColumn.schemaName,
          tableName: fileColumn.tableName
        };
      }
    });

    // Find removed fileColumns and delete them from table
    existingFileColumns.forEach((existingFileColumn) => {
      let isStillExisting = false;
      fileColumns.forEach((fileColumn) => {
        if (fileColumn.schemaName === existingFileColumn.schemaName && fileColumn.tableName === existingFileColumn.tableName && fileColumn.columnName === existingFileColumn.columnName) {
          isStillExisting = true;
        }
      });

      if (isStillExisting === false) {
        sqls.push(`DELETE FROM "_file_storage"."Columns" WHERE "id"='${existingFileColumn.id}';`);
      }
    });

    if (sqls.length > 0) {
      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA
      });
    }

    // Find missing triggers and create them
    Object.values(tableTriggers).forEach((table) => {
      let isExisting = false;
      existingTriggers.forEach((existingTrigger) => {
        if (table.schemaName === existingTrigger.event_object_schema && table.tableName === existingTrigger.event_object_table) {
          isExisting = true;
        }
      });

      if (isExisting === false) {
        const triggerName = `fileStorage_trigger_${uuidv4()}`;
        const schemaTableName = `${getPgSelector(table.schemaName)}.${getPgSelector(table.tableName)}`;

        const createTriggerSql = `CREATE TRIGGER ${getPgSelector(triggerName)} BEFORE UPDATE OR INSERT OR DELETE ON ${schemaTableName} FOR EACH ROW EXECUTE PROCEDURE _file_storage.file_trigger();`;

        result.commands.push({
          sqls: [createTriggerSql],
          operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN + 100
        });
      }
    });

    // Find triggers that are not required anymore
    existingTriggers.forEach((existingTrigger) => {
      const tableKey = `${existingTrigger.event_object_schema}.${existingTrigger.event_object_table}`;

      if (tableTriggers[tableKey] == null) {
        const schemaTableName = `${getPgSelector(existingTrigger.event_object_schema)}.${getPgSelector(existingTrigger.event_object_table)}`;
        const dropTriggerSql = `DROP TRIGGER ${getPgSelector(existingTrigger.trigger_name)} ON ${schemaTableName} CASCADE;`;

        result.commands.push({
          sqls: [dropTriggerSql],
          operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE - 100
        });
      }
    });

    return result;
  }
}