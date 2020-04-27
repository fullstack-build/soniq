import { ISchemaExtension, IHelpers } from "../ISchemaExtension";
import { IDbSchema, IDbTable } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION, asyncForEach } from "@fullstack-one/core";
import { IGqlMigrationResult, IColumnInfo, ITableMeta, ITableMetaByTableId } from "../../interfaces";
import { createMergeResultFunction, ONE_PREFIX } from "../../helpers";
import { getTables } from "./queryHelper";
import { ITableExtension, IHelpersWithColumnHelper, ITableExtensionData } from "../../tableExtensions/ITableExtension";

export const schemaExtensionTables: ISchemaExtension = {
  generateCommands: async (schema: IDbSchema, dbClient: PoolClient, helpers: IHelpers, gqlMigrationContext: any): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };
    const mergeResult = createMergeResultFunction(result);

    const tables = await getTables(dbClient, schema.schemas);
    const existingTablesById: ITableMetaByTableId = {};
    const proceededTableIds: string[] = [];
    const tablesToDelete: ITableMeta[] = [];
    const schemaTables = schema.tables || [];

    // Check if current tables have unique id's
    const tableIndicesById = {};
    tables.forEach((table, index) => {
      if (table.id != null) {
        if (tableIndicesById[table.id] == null) {
          tableIndicesById[table.id] = [];
        }
        tableIndicesById[table.id].push(index);
      }
    });

    Object.keys(tableIndicesById).forEach((tableId) => {
      if (tableIndicesById[tableId].length > 1) {
        const listOfTables = tableIndicesById[tableId].map((index) => {
          return `${tables[index].schema}.${tables[index].name}`;
        });
        result.errors.push({ message: `Duplicate id-comment on [${listOfTables.join(", ")}]. Remove them to try auto-fix.`, meta: { tableId } });
      }
    });

    // If an error occured until here (e.g. ID-Duplicate) do not continue.
    if (result.errors.length > 0) {
      return result;
    }

    // Try to find matching table by ID
    tables.forEach((tableMeta) => {
      if (tableMeta.id != null) {
        schemaTables.forEach((table) => {
          if (tableMeta.id === table.id) {
            proceededTableIds.push(table.id);

            existingTablesById[table.id] = tableMeta;

            if (tableMeta.name !== table.name) {
              const tempTableName = `_one_temp_${table.id}`;
              result.commands.push({
                sqls: [`ALTER TABLE "${tableMeta.schema}"."${tableMeta.name}" RENAME TO "${tempTableName}";`],
                operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE - 1
              });
              result.commands.push({
                sqls: [`ALTER TABLE "${tableMeta.schema}"."${tempTableName}" RENAME TO "${table.name}";`],
                operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE + 1
              });
            }
            if (tableMeta.schema !== table.schema) {
              result.commands.push({
                sqls: [`ALTER TABLE "${tableMeta.schema}"."${table.name}" SET SCHEMA "${table.schema}";`],
                operationSortPosition: OPERATION_SORT_POSITION.RENAME_TABLE + 2
              });
            }
          }
        });
      }
    });

    // Try to map other tables, which are not found by id
    await asyncForEach(tables, async (tableMeta: ITableMeta) => {
      if (tableMeta.id != null && proceededTableIds.indexOf(tableMeta.id) >= 0) {
        return;
      }
      let tableProceeded: any = false;

      schemaTables.forEach((table) => {
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
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT
          });
          result.warnings.push({
            message: `Do not manipulate the id-comment on "${table.schema}"."${table.name}". [fixed]`,
            meta: { tableId: table.id }
          });
        }
      });

      // If the table does not match anything it has been removed
      if (tableProceeded !== true) {
        tablesToDelete.push(tableMeta);

        result.commands.push({
          sqls: [`DROP TABLE "${tableMeta.schema}"."${tableMeta.name}";`],
          description: "Create tables",
          operationSortPosition: OPERATION_SORT_POSITION.DROP_TABLE
        });
      }
    });

    // Tables, which are not proceeded until here need to get created
    schemaTables.forEach((table) => {
      if (proceededTableIds.indexOf(table.id) >= 0) {
        return;
      }
      result.commands.push({
        sqls: [
          `CREATE TABLE "${table.schema}"."${table.name}" ("_one_temp" integer);`,
          `ALTER TABLE "${table.schema}"."${table.name}" DROP COLUMN "_one_temp";`,
          `COMMENT ON TABLE "${table.schema}"."${table.name}" IS '${ONE_PREFIX}${table.id}';`
        ],
        description: "Create tables",
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_TABLE
      });
    });

    // Get and execute table-extensions
    const tableExtensions = helpers.getTableExtensions();

    // Preload data required for table extension
    const preloadedDataByTableExtensionIndex: { [index: string]: ITableExtensionData[] } = {};
    await asyncForEach(tableExtensions, async (tableExtension: ITableExtension, index: number) => {
      if (tableExtension.preloadData != null) {
        preloadedDataByTableExtensionIndex[`${index}`] = await tableExtension.preloadData(schema, dbClient, gqlMigrationContext);
      }
    });

    // First clean up data of deleted Tables
    await asyncForEach(tablesToDelete, async (tableMeta: ITableMeta) => {
      await asyncForEach(tableExtensions, async (tableExtension: ITableExtension, index: number) => {
        if (tableExtension.cleanUpDeletedTable != null) {
          let filteredTableExtensionData = [];
          if (preloadedDataByTableExtensionIndex[`${index}`] != null) {
            filteredTableExtensionData = filterTableExtensionData(tableMeta, preloadedDataByTableExtensionIndex[`${index}`]);
          }

          const cleanUpResult = await tableExtension.cleanUpDeletedTable(
            schema,
            tableMeta,
            filteredTableExtensionData,
            helpers,
            dbClient,
            gqlMigrationContext
          );
          mergeResult(cleanUpResult);
        }
      });
    });

    // Now lets add or alter columns/indexes/etc
    await asyncForEach(schemaTables, async (table: IDbTable) => {
      const columnHelpers: IHelpersWithColumnHelper = {
        ...helpers,
        getColumnDataByColumnId: (columnId: string) => {
          for (const i in table.columns) {
            if (table.columns.hasOwnProperty(i)) {
              const column = table.columns[i];
              if (column.id === columnId) {
                return {
                  schema,
                  table,
                  column,
                  columnExtension: helpers.getColumnExtensionByType(column.type)
                };
              }
            }
          }
          return null;
        }
      };

      await asyncForEach(tableExtensions, async (tableExtension: ITableExtension, index: number) => {
        let filteredTableExtensionData = [];
        if (preloadedDataByTableExtensionIndex[`${index}`] != null) {
          filteredTableExtensionData = filterTableExtensionData(existingTablesById[table.id], preloadedDataByTableExtensionIndex[`${index}`]);
        }

        const extensionResult = await tableExtension.generateCommands(
          table,
          schema,
          filteredTableExtensionData,
          columnHelpers,
          dbClient,
          gqlMigrationContext
        );
        mergeResult(extensionResult);
      });
    });

    return result;
  }
};

const filterTableExtensionData = (tableMeta: ITableMeta, preloadedData: ITableExtensionData[]): ITableExtensionData[] => {
  if (tableMeta == null) {
    return [];
  }

  const filteredTableExtensionData = preloadedData.filter((entry) => {
    return entry.table_name === tableMeta.name && entry.table_schema === tableMeta.schema;
  });

  return filteredTableExtensionData;
};
