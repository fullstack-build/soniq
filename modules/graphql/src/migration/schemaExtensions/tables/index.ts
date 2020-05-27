import { ISchemaExtension, IHelpers } from "../ISchemaExtension";
import { IDbSchema, IDbTable } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
import { IGqlMigrationResult, ITableMeta, ITableMetaByTableId, IGqlMigrationContext } from "../../interfaces";
import { createMergeResultFunction, ONE_PREFIX } from "../../helpers";
import { getTables } from "./queryHelper";
import {
  ITableExtension,
  IHelpersWithColumnHelper,
  ITableExtensionData,
  IColumnData,
} from "../../tableExtensions/ITableExtension";
import { IColumnExtension } from "../../columnExtensions/IColumnExtension";
import { IGraphqlAppConfig } from "../../../moduleDefinition/interfaces";

function filterTableExtensionData(tableMeta: ITableMeta, preloadedData: ITableExtensionData[]): ITableExtensionData[] {
  if (tableMeta == null) {
    return [];
  }

  const filteredTableExtensionData: ITableExtensionData[] = preloadedData.filter(
    (entry: ITableExtensionData): boolean => {
      return entry.table_name === tableMeta.name && entry.table_schema === tableMeta.schema;
    }
  );

  return filteredTableExtensionData;
}

export const schemaExtensionTables: ISchemaExtension = {
  generateCommands: async (
    appConfig: IGraphqlAppConfig,
    dbClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: IGqlMigrationContext
  ): Promise<IGqlMigrationResult> => {
    const schema: IDbSchema = appConfig.schema;
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };
    const mergeResult: (newResult: IGqlMigrationResult) => void = createMergeResultFunction(result);

    const tables: ITableMeta[] = await getTables(dbClient, schema.schemas);
    const existingTablesById: ITableMetaByTableId = {};
    const proceededTableIds: string[] = [];
    const tablesToDelete: ITableMeta[] = [];
    const schemaTables: IDbTable[] = schema.tables || [];

    // Check if current tables have unique id's
    const tableIndicesById: {
      [tableId: string]: number[];
    } = {};
    tables.forEach((table: ITableMeta, index: number): void => {
      if (table.id != null) {
        if (tableIndicesById[table.id] == null) {
          tableIndicesById[table.id] = [];
        }
        tableIndicesById[table.id].push(index);
      }
    });

    Object.keys(tableIndicesById).forEach((tableId: string) => {
      if (tableIndicesById[tableId].length > 1) {
        const listOfTables: string[] = tableIndicesById[tableId].map((index: number) => {
          return `${tables[index].schema}.${tables[index].name}`;
        });
        result.errors.push({
          message: `Duplicate id-comment on [${listOfTables.join(", ")}]. Remove them to try auto-fix.`,
          meta: { tableId },
          objectId: tableId,
        });
      }
    });

    // If an error occured until here (e.g. ID-Duplicate) do not continue.
    if (result.errors.length > 0) {
      return result;
    }

    // Try to find matching table by ID
    tables.forEach((tableMeta: ITableMeta) => {
      if (tableMeta.id != null) {
        schemaTables.forEach((table: IDbTable) => {
          if (tableMeta.id === table.id) {
            proceededTableIds.push(table.id);

            existingTablesById[table.id] = tableMeta;

            if (tableMeta.name !== table.name) {
              const tempTableName: string = `_one_temp_${table.id}`;
              result.commands.push({
                sqls: [`ALTER TABLE "${tableMeta.schema}"."${tableMeta.name}" RENAME TO "${tempTableName}";`],
                operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE - 1,
                objectId: table.id,
              });
              result.commands.push({
                sqls: [`ALTER TABLE "${tableMeta.schema}"."${tempTableName}" RENAME TO "${table.name}";`],
                operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE + 1,
                objectId: table.id,
              });
            }
            if (tableMeta.schema !== table.schema) {
              result.commands.push({
                sqls: [`ALTER TABLE "${tableMeta.schema}"."${table.name}" SET SCHEMA "${table.schema}";`],
                operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE + 2,
                objectId: table.id,
              });
            }
          }
        });
      }
    });

    // Try to map other tables, which are not found by id
    for (const tableMeta of tables) {
      if (tableMeta.id != null && proceededTableIds.indexOf(tableMeta.id) >= 0) {
        continue;
      }
      let tableProceeded: unknown = false;

      schemaTables.forEach((table: IDbTable) => {
        if (proceededTableIds.indexOf(table.id) >= 0) {
          return;
        }
        if (tableMeta.schema === table.schema && tableMeta.name === table.name) {
          proceededTableIds.push(table.id);
          tableProceeded = true;

          existingTablesById[table.id] = tableMeta;

          // When we found the table fix the comment
          result.commands.push({
            sqls: [`COMMENT ON TABLE "${table.schema}"."${table.name}" IS '${ONE_PREFIX}${table.id}';`],
            description: `Fix table id-comment of "${table.schema}"."${table.name}".`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT,
            objectId: table.id,
          });
          result.warnings.push({
            message: `Do not manipulate the id-comment on "${table.schema}"."${table.name}". [fixed]`,
            meta: { tableId: table.id },
            objectId: table.id,
          });
        }
      });

      // If the table does not match anything it has been removed
      if (tableProceeded !== true) {
        tablesToDelete.push(tableMeta);

        result.commands.push({
          sqls: [`DROP TABLE "${tableMeta.schema}"."${tableMeta.name}";`],
          description: "Create tables",
          operationSortPosition: OPERATION_SORT_POSITION.DROP_TABLE,
        });
      }
    }

    // Tables, which are not proceeded until here need to get created
    schemaTables.forEach((table: IDbTable) => {
      if (proceededTableIds.indexOf(table.id) >= 0) {
        return;
      }
      result.commands.push({
        sqls: [
          `CREATE TABLE "${table.schema}"."${table.name}" ("_one_temp" integer);`,
          `ALTER TABLE "${table.schema}"."${table.name}" DROP COLUMN "_one_temp";`,
          `COMMENT ON TABLE "${table.schema}"."${table.name}" IS '${ONE_PREFIX}${table.id}';`,
        ],
        description: "Create tables",
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_TABLE,
        objectId: table.id,
      });
    });

    // Get and execute table-extensions
    const tableExtensions: ITableExtension[] = helpers.getTableExtensions();

    // Preload data required for table extension
    const preloadedDataByTableExtensionIndex: {
      [index: string]: ITableExtensionData[];
    } = {};
    for (const [index, tableExtension] of tableExtensions.entries()) {
      if (tableExtension.preloadData != null) {
        preloadedDataByTableExtensionIndex[`${index}`] = await tableExtension.preloadData(
          schema,
          dbClient,
          gqlMigrationContext
        );
      }
    }

    // First clean up data of deleted Tables
    for (const tableMeta of tablesToDelete) {
      for (const [index, tableExtension] of tableExtensions.entries()) {
        if (tableExtension.cleanUpDeletedTable != null) {
          let filteredTableExtensionData: unknown[] = [];
          if (preloadedDataByTableExtensionIndex[`${index}`] != null) {
            filteredTableExtensionData = filterTableExtensionData(
              tableMeta,
              preloadedDataByTableExtensionIndex[`${index}`]
            );
          }

          const cleanUpResult: IGqlMigrationResult = await tableExtension.cleanUpDeletedTable(
            schema,
            tableMeta,
            filteredTableExtensionData,
            helpers,
            dbClient,
            gqlMigrationContext
          );
          mergeResult(cleanUpResult);
        }
      }
    }

    // Now lets add or alter columns/indexes/etc
    for (const table of schemaTables) {
      const columnHelpers: IHelpersWithColumnHelper = {
        ...helpers,
        getColumnDataByColumnId: (columnId: string): IColumnData | null => {
          for (const column of table.columns) {
            if (column.id === columnId) {
              const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(column.type);

              if (columnExtension == null) {
                throw new Error(`Could not find columnExtension for type ${column.type} in columnId ${column.id}.`);
              }

              return {
                schema,
                table,
                column,
                columnExtension,
              };
            }
          }
          return null;
        },
      };

      for (const [index, tableExtension] of tableExtensions.entries()) {
        let filteredTableExtensionData: unknown[] = [];
        if (preloadedDataByTableExtensionIndex[`${index}`] != null) {
          filteredTableExtensionData = filterTableExtensionData(
            existingTablesById[table.id],
            preloadedDataByTableExtensionIndex[`${index}`]
          );
        }

        const extensionResult: IGqlMigrationResult = await tableExtension.generateCommands(
          table,
          schema,
          filteredTableExtensionData,
          columnHelpers,
          dbClient,
          gqlMigrationContext
        );
        mergeResult(extensionResult);
      }
    }

    return result;
  },
};
