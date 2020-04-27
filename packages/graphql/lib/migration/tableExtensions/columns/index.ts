import { IDbSchema, IDbTable, IDbColumn } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION, asyncForEach, Ajv } from "@fullstack-one/core";
import { IGqlMigrationResult, IColumnInfo, IUpdateColumns, IUpdateColumn, ITableMeta } from "../../interfaces";
import { getPgRegClass, createMergeResultFunction, ONE_PREFIX } from "../../helpers";
import { IColumnExtensionDeleteContext, IColumnExtensionContext } from "../../columnExtensions/IColumnExtension";
import { ITableExtension, IHelpersWithColumnHelper } from "../ITableExtension";
import { getTableColumnsInfo } from "./queryHelper";
import { IHelpers } from "../../schemaExtensions/ISchemaExtension";

export const tableExtenstionColumns: ITableExtension = {
  preloadData: async (schema: IDbSchema, dbClient: PoolClient): Promise<IColumnInfo[]> => {
    const columnsInfo = await getTableColumnsInfo(dbClient, schema.schemas);
    return columnsInfo;
  },
  generateCommands: async (
    table: IDbTable,
    schema: IDbSchema,
    columnsInfo: IColumnInfo[],
    helpers: IHelpersWithColumnHelper,
    dbClient: PoolClient,
    gqlMigrationContext: any
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };
    const mergeResult = createMergeResultFunction(result);

    const columns = table.columns
      .map((column, columnIndex) => {
        // Check if current tables have unique id's
        const idValidation = helpers.validateId(column.id);

        if (idValidation != null) {
          result.errors.push({
            message: `ID of column ${column.id} is invalid: ${idValidation}.`,
            meta: {
              tableId: table.id,
              columnId: column.id
            }
          });
        } else {
          const columnExtensionContext: IColumnExtensionContext = {
            schema,
            table,
            column,
            columnIndex
          };
          const columnExtension = helpers.getColumnExtensionByType(column.type);
          if (columnExtension == null) {
            result.errors.push({
              message: `Unknown column type '${column.type}' in '${table.schema}.${table.name}.${column.name}'.`,
              meta: {
                tableId: table.id,
                columnId: column.id
              }
            });
            return null;
          } else {
            try {
              const columnValidationSchema = columnExtension.getPropertiesDefinition();
              const ajv = new Ajv();
              const validate = ajv.compile(columnValidationSchema);
              const valid = validate(column.properties || {});
              const errors = (validate.errors || []).map((err) => {
                return {
                  message: `Failed to validate column-properties '${table.schema}.${table.name}.${column.name}' of type '${column.type}': ${err.message}`,
                  error: err,
                  meta: {
                    tableId: table.id,
                    columnId: column.id
                  }
                };
              });

              mergeResult({
                errors,
                warnings: [],
                commands: []
              });

              if (errors.length < 1 && columnExtension.validateProperties != null) {
                const validationResult = columnExtension.validateProperties(columnExtensionContext);

                mergeResult({
                  ...validationResult,
                  commands: []
                });
              }

              return columnExtension.getPgColumnName(columnExtensionContext) != null ? column : null;
            } catch (e) {
              result.errors.push({
                message: `Failed to validate column '${table.schema}.${table.name}.${column.name}' of type '${column.type}': ${e.message}`,
                meta: {
                  tableId: table.id,
                  columnId: column.id
                }
              });
            }
          }
        }
      })
      .filter((column) => {
        return column != null;
      });

    // If an error occured until here (e.g. Unkown column type) do not continue.
    if (result.errors.length > 0) {
      return result;
    }

    const updateColumns: IUpdateColumns = {};

    columnsInfo.forEach((columnInfo) => {
      if (columnInfo.id != null) {
        columns.forEach((column) => {
          if (columnInfo.id === column.id) {
            updateColumns[column.id] = {
              columnInfo,
              column
            };
          }
        });
      }
    });

    await asyncForEach(columnsInfo, async (columnInfo: IColumnInfo) => {
      // If the id is in updateColumns, the column has already been identified
      if (columnInfo.id != null && updateColumns[columnInfo.id] != null) {
        return;
      }
      let columnProceeded: any = false;

      // Try to match columns by name
      columns.forEach((column, columnIndex) => {
        // If the id is in updateColumns, the column has already been identified
        if (updateColumns[column.id] != null) {
          return;
        }
        const columnExtensionContext: IColumnExtensionContext = {
          schema,
          table,
          column,
          columnIndex
        };
        const columnExtension = helpers.getColumnExtensionByType(column.type);
        if (columnInfo.column_name === columnExtension.getPgColumnName(columnExtensionContext)) {
          columnProceeded = true;
          updateColumns[column.id] = {
            columnInfo,
            column
          };

          // When we found the column over the name we fix this by adding the id-comment
          result.commands.push({
            sqls: [
              `COMMENT ON COLUMN "${table.schema}"."${table.name}"."${columnExtension.getPgColumnName(columnExtensionContext)}" IS '${ONE_PREFIX}${
                column.id
              }_${column.type}_${columnInfo.userComment || "Your own comment"}';`
            ],
            description: `Fix column id-comment of "${table.schema}"."${table.name}"."${column.name}".`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT
          });
          result.warnings.push({
            message: `Do not manipulate the id-comment on '${table.schema}.${table.name}.${column.name}'. [fixed]`,
            meta: {
              tableId: table.id,
              columnId: column.id
            }
          });
        }
      });

      // If not found we can drop the column
      if (columnProceeded !== true) {
        const columnExtension = helpers.getColumnExtensionByType(columnInfo.type);
        if (columnExtension != null && columnExtension.cleanUp != null) {
          const columnExtensionDeleteContext: IColumnExtensionDeleteContext = {
            schema,
            table
          };
          const deleteColumnResult = await columnExtension.cleanUp(columnExtensionDeleteContext, columnInfo, dbClient, gqlMigrationContext);
          mergeResult(deleteColumnResult);
        }
        result.commands.push({
          sqls: [`ALTER TABLE "${columnInfo.table_schema}"."${columnInfo.table_name}" DROP COLUMN "${columnInfo.column_name}";`],
          operationSortPosition: OPERATION_SORT_POSITION.DROP_COLUMN
        });
      }
    });

    // All columns, which are not in updateColumns are new
    await asyncForEach(columns, async (column: IDbColumn, columnIndex: number) => {
      if (updateColumns[column.id] == null) {
        try {
          const columnExtensionContext: IColumnExtensionContext = {
            schema,
            table,
            column,
            columnIndex
          };
          const columnExtension = helpers.getColumnExtensionByType(column.type);
          const createColumnResult = await columnExtension.create(columnExtensionContext, dbClient, gqlMigrationContext);
          mergeResult(createColumnResult);
          result.commands.push({
            sqls: [
              `COMMENT ON COLUMN "${table.schema}"."${table.name}"."${columnExtension.getPgColumnName(columnExtensionContext)}" IS '${ONE_PREFIX}${
                column.id
              }_${column.type}_Your own comment';`
            ],
            description: `Add id-comment on column '${table.schema}.${table.name}.${columnExtension.getPgColumnName(columnExtensionContext)}'.`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT
          });
        } catch (err) {
          result.errors.push({
            message: `Error on add column of '${table.schema}.${table.name}.${column.name}': ${err.message}`,
            error: err,
            meta: {
              tableId: table.id,
              columnId: column.id
            }
          });
        }
      }
    });

    // Rename/Alter existing columns that still exist in new schema
    await asyncForEach(Object.values(updateColumns), async (updateColumn: IUpdateColumn) => {
      try {
        const columnExtensionContext: IColumnExtensionContext = {
          schema,
          table,
          column: updateColumn.column
        };
        const columnExtension = helpers.getColumnExtensionByType(updateColumn.column.type);

        // Rename column
        if (columnExtension.getPgColumnName(columnExtensionContext) !== updateColumn.columnInfo.column_name) {
          const tempColumnName = `_one_temp_${updateColumn.column.id}`;
          result.commands.push({
            sqls: [`ALTER TABLE ${getPgRegClass(table)} RENAME COLUMN "${updateColumn.columnInfo.column_name}" TO "${tempColumnName}";`],
            operationSortPosition: OPERATION_SORT_POSITION.RENAME_COLUMN - 1
          });
          result.commands.push({
            sqls: [
              `ALTER TABLE ${getPgRegClass(table)} RENAME COLUMN "${tempColumnName}" TO "${columnExtension.getPgColumnName(columnExtensionContext)}";`
            ],
            operationSortPosition: OPERATION_SORT_POSITION.RENAME_COLUMN + 1
          });
        }

        // Check if the type has changed
        if (updateColumn.columnInfo.type != null && updateColumn.columnInfo.type !== updateColumn.column.type) {
          // Type has changed. Run cleanUp on old type if available
          const formerColumnExtension = helpers.getColumnExtensionByType(updateColumn.columnInfo.type);
          if (formerColumnExtension != null && formerColumnExtension.cleanUp != null) {
            const columnExtensionCleanUpContext: IColumnExtensionDeleteContext = {
              schema,
              table
            };
            const cleanUpResult = await formerColumnExtension.cleanUp(
              columnExtensionCleanUpContext,
              updateColumn.columnInfo,
              dbClient,
              gqlMigrationContext
            );
            mergeResult(cleanUpResult);
          }
          result.commands.push({
            sqls: [
              `COMMENT ON COLUMN "${table.schema}"."${table.name}"."${columnExtension.getPgColumnName(columnExtensionContext)}" IS '${ONE_PREFIX}${
                updateColumn.column.id
              }_${updateColumn.column.type}_${updateColumn.columnInfo.userComment || "Your own comment"}';`
            ],
            description: `Fix column id-comment of "${table.schema}"."${table.name}"."${updateColumn.column.name}".`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT
          });
        }

        // Alter column type/constraints/whatever
        const updateColumnResult = await columnExtension.update(columnExtensionContext, updateColumn.columnInfo, dbClient, gqlMigrationContext);
        mergeResult(updateColumnResult);
      } catch (e) {
        result.errors.push({
          message: `Error on update column of '${table.schema}.${table.name}.${updateColumn.column.name}': ${e.message}`,
          meta: {
            tableId: table.id,
            columnId: updateColumn.column.id
          }
        });
      }
    });

    return result;
  },
  cleanUpDeletedTable: async (
    schema: IDbSchema,
    tableMeta: ITableMeta,
    columnsInfo: IColumnInfo[],
    helpers: IHelpers,
    dbClient: PoolClient,
    gqlMigrationContext: any
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };
    const mergeResult = createMergeResultFunction(result);
    // Drop all columns
    await asyncForEach(columnsInfo, async (columnInfo: IColumnInfo) => {
      if (columnInfo.id != null) {
        const columnExtension = helpers.getColumnExtensionByType(columnInfo.type);
        if (columnExtension != null && columnExtension.cleanUp != null) {
          const columnExtensionDeleteContext: IColumnExtensionDeleteContext = {
            schema,
            table: tableMeta
          };
          const deleteColumnResult = await columnExtension.cleanUp(columnExtensionDeleteContext, columnInfo, dbClient, gqlMigrationContext);
          mergeResult(deleteColumnResult);
        }
        result.commands.push({
          sqls: [`ALTER TABLE "${columnInfo.table_schema}"."${columnInfo.table_name}" DROP COLUMN "${columnInfo.column_name}";`],
          operationSortPosition: OPERATION_SORT_POSITION.DROP_COLUMN
        });
      }
    });

    return result;
  }
};
