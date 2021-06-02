import {
  IDbSchema,
  IHelpers,
  IGqlMigrationResult,
  IPostProcessingExtension,
  IGqlMigrationContext,
} from "@soniq/graphql";
import { PoolClient, getPgSelector, OPERATION_SORT_POSITION } from "soniq";
import { getFileColumns, IFileColumn, getTriggers, ITrigger } from "./queryHelper";
import * as uuid from "uuid";

const EXISTS_QUERY: string = `
SELECT EXISTS (
   SELECT 1
	   FROM   information_schema.tables 
	   WHERE  table_schema = '_file_storage'
	   AND    table_name = 'Columns'
   ) "exists";
`;

async function doesColumnsTableExist(pgClient: PoolClient): Promise<boolean> {
  const { rows } = await pgClient.query(EXISTS_QUERY);

  return rows[0] != null && rows[0].exists != null && rows[0].exists === true;
}

export const postProcessingExtensionFile: IPostProcessingExtension = {
  generateCommands: async (
    schema: IDbSchema,
    pgClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: IGqlMigrationContext,
    result: IGqlMigrationResult
  ): Promise<IGqlMigrationResult> => {
    const fileColumns: IFileColumn[] = gqlMigrationContext.fileStorageColumns || [];
    const doesColumnsTableExistNow: boolean = await doesColumnsTableExist(pgClient);
    const existingFileColumns: IFileColumn[] =
      doesColumnsTableExistNow === true ? await getFileColumns(pgClient, schema.schemas) : [];
    const existingTriggers: ITrigger[] = await getTriggers(pgClient, schema.schemas);
    const tableTriggers: { [tableKey: string]: { schemaName: string; tableName: string } } = {};
    const sqls: string[] = [];

    // Find new and changed fileColumns to update or insert
    fileColumns.forEach((fileColumn) => {
      let isExisting: boolean = false;
      let updateId: string | null = null;
      existingFileColumns.forEach((existingFileColumn) => {
        if (
          fileColumn.schemaName === existingFileColumn.schemaName &&
          fileColumn.tableName === existingFileColumn.tableName &&
          fileColumn.columnName === existingFileColumn.columnName
        ) {
          isExisting = true;
          if (JSON.stringify(fileColumn.types) !== JSON.stringify(existingFileColumn.types)) {
            updateId = existingFileColumn.id;
          }
        }
      });

      if (isExisting === false) {
        sqls.push(
          `INSERT INTO _file_storage."Columns"("schemaName", "tableName", "columnName", "types") VALUES($tok$${
            fileColumn.schemaName
          }$tok$, $tok$${fileColumn.tableName}$tok$, $tok$${fileColumn.columnName}$tok$, $tok$${JSON.stringify(
            fileColumn.types
          )}$tok$);`
        );
      } else {
        if (updateId != null) {
          sqls.push(
            `UPDATE "_file_storage"."Columns" SET "types"=$tok$${JSON.stringify(
              fileColumn.types
            )}$tok$ WHERE "id"='${updateId}';`
          );
        }
      }

      const tableKey: string = `${fileColumn.schemaName}.${fileColumn.tableName}`;
      if (tableTriggers[tableKey] == null) {
        tableTriggers[tableKey] = {
          schemaName: fileColumn.schemaName,
          tableName: fileColumn.tableName,
        };
      }
    });

    // Find removed fileColumns and delete them from table
    existingFileColumns.forEach((existingFileColumn) => {
      let isStillExisting: boolean = false;
      fileColumns.forEach((fileColumn) => {
        if (
          fileColumn.schemaName === existingFileColumn.schemaName &&
          fileColumn.tableName === existingFileColumn.tableName &&
          fileColumn.columnName === existingFileColumn.columnName
        ) {
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
        operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
      });
    }

    // Find missing triggers and create them
    Object.values(tableTriggers).forEach((table) => {
      let isExisting: boolean = false;
      existingTriggers.forEach((existingTrigger) => {
        if (
          table.schemaName === existingTrigger.event_object_schema &&
          table.tableName === existingTrigger.event_object_table
        ) {
          isExisting = true;
        }
      });

      if (isExisting === false) {
        const triggerName: string = `fileStorage_trigger_${uuid.v4()}`;
        const schemaTableName: string = `${getPgSelector(table.schemaName)}.${getPgSelector(table.tableName)}`;

        const createTriggerSql: string = `CREATE TRIGGER ${getPgSelector(
          triggerName
        )} BEFORE UPDATE OR INSERT OR DELETE ON ${schemaTableName} FOR EACH ROW EXECUTE PROCEDURE _file_storage.file_trigger_plpgsql();`;

        result.commands.push({
          sqls: [createTriggerSql],
          operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN + 200,
        });
      }
    });

    // Find triggers that are not required anymore
    existingTriggers.forEach((existingTrigger) => {
      const tableKey: string = `${existingTrigger.event_object_schema}.${existingTrigger.event_object_table}`;

      if (tableTriggers[tableKey] == null) {
        const schemaTableName: string = `${getPgSelector(existingTrigger.event_object_schema)}.${getPgSelector(
          existingTrigger.event_object_table
        )}`;
        const dropTriggerSql: string = `DROP TRIGGER ${getPgSelector(
          existingTrigger.trigger_name
        )} ON ${schemaTableName} CASCADE;`;

        result.commands.push({
          sqls: [dropTriggerSql],
          operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 200,
        });
      }
    });

    return result;
  },
};
