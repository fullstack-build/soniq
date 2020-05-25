import { IDbSchema, IDbTable, IDbColumn } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION, asyncForEach, Ajv, IMigrationError } from "soniq";
import {
  IGqlMigrationResult,
  IColumnInfo,
  IUpdateColumns,
  IUpdateColumn,
  ITableMeta,
  IGqlMigrationContext,
} from "../../interfaces";
import { getPgRegClass, createMergeResultFunction, ONE_PREFIX } from "../../helpers";
import {
  IColumnExtensionDeleteContext,
  IColumnExtensionContext,
  IColumnExtension,
  IPropertieValidationResult,
} from "../../columnExtensions/IColumnExtension";
import { ITableExtension, IHelpersWithColumnHelper } from "../ITableExtension";
import { getTableColumnsInfo } from "./queryHelper";
import { IHelpers } from "../../schemaExtensions/ISchemaExtension";

export const tableExtenstionColumns: ITableExtension = {
  preloadData: async (schema: IDbSchema, dbClient: PoolClient): Promise<IColumnInfo[]> => {
    const columnsInfo: IColumnInfo[] = await getTableColumnsInfo(dbClient, schema.schemas);
    return columnsInfo;
  },
  generateCommands: async (
    table: IDbTable,
    schema: IDbSchema,
    columnsInfo: IColumnInfo[],
    helpers: IHelpersWithColumnHelper,
    dbClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };
    const mergeResult: (newResult: IGqlMigrationResult) => void = createMergeResultFunction(result);

    const columns: (IDbColumn | null)[] = table.columns
      .map((column: IDbColumn, columnIndex: number): IDbColumn | null => {
        // Check if current tables have unique id's
        const idValidation: string | null = helpers.validateId(column.id);

        if (idValidation != null) {
          result.errors.push({
            message: `ID of column ${column.id} is invalid: ${idValidation}.`,
            meta: {
              tableId: table.id,
              columnId: column.id,
            },
          });
        } else {
          const columnExtensionContext: IColumnExtensionContext = {
            schema,
            table,
            column,
            columnIndex,
          };
          const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(column.type);
          if (columnExtension == null) {
            result.errors.push({
              message: `Unknown column type '${column.type}' in '${table.schema}.${table.name}.${column.name}'.`,
              meta: {
                tableId: table.id,
                columnId: column.id,
              },
            });
            return null;
          } else {
            try {
              const columnValidationSchema: boolean | object = columnExtension.getPropertiesDefinition();
              const ajv: Ajv.Ajv = new Ajv();
              const validate: Ajv.ValidateFunction = ajv.compile(columnValidationSchema);
              const errors: IMigrationError[] = (validate.errors || []).map(
                (err: Ajv.ErrorObject): IMigrationError => {
                  return {
                    message: `Failed to validate column-properties '${table.schema}.${table.name}.${column.name}' of type '${column.type}': ${err.message}`,
                    error: err,
                    meta: {
                      tableId: table.id,
                      columnId: column.id,
                    },
                  };
                }
              );

              mergeResult({
                errors,
                warnings: [],
                commands: [],
              });

              if (errors.length < 1 && columnExtension.validateProperties != null) {
                const validationResult: IPropertieValidationResult = columnExtension.validateProperties(
                  columnExtensionContext
                );

                mergeResult({
                  ...validationResult,
                  commands: [],
                });
              }

              return columnExtension.getPgColumnName(columnExtensionContext) != null ? column : null;
            } catch (e) {
              result.errors.push({
                message: `Failed to validate column '${table.schema}.${table.name}.${column.name}' of type '${column.type}': ${e.message}`,
                meta: {
                  tableId: table.id,
                  columnId: column.id,
                },
              });
            }
          }
        }
        return null;
      })
      .filter((column: IDbColumn | null) => {
        return column != null;
      });

    // If an error occured until here (e.g. Unkown column type) do not continue.
    if (result.errors.length > 0) {
      return result;
    }

    const updateColumns: IUpdateColumns = {};

    columnsInfo.forEach((columnInfo: IColumnInfo) => {
      if (columnInfo.id != null) {
        columns.forEach((column: IDbColumn | null | undefined) => {
          if (column != null && columnInfo.id === column.id) {
            updateColumns[column.id] = {
              columnInfo,
              column,
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
      let columnProceeded: unknown = false;

      // Try to match columns by name
      columns.forEach((column: IDbColumn | null | undefined, columnIndex: number) => {
        // If the id is in updateColumns, the column has already been identified
        if (column == null || updateColumns[column.id] != null) {
          return;
        }
        const columnExtensionContext: IColumnExtensionContext = {
          schema,
          table,
          column,
          columnIndex,
        };
        const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(column.type);

        if (columnExtension == null) {
          throw new Error(`Could not find columnExtension for type ${column.type} in column ${column.id}`);
        }

        if (columnInfo.column_name === columnExtension.getPgColumnName(columnExtensionContext)) {
          columnProceeded = true;
          updateColumns[column.id] = {
            columnInfo,
            column,
          };

          // When we found the column over the name we fix this by adding the id-comment
          result.commands.push({
            sqls: [
              `COMMENT ON COLUMN "${table.schema}"."${table.name}"."${columnExtension.getPgColumnName(
                columnExtensionContext
              )}" IS '${ONE_PREFIX}${column.id}_${column.type}_${columnInfo.userComment || "Your own comment"}';`,
            ],
            description: `Fix column id-comment of "${table.schema}"."${table.name}"."${column.name}".`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT,
          });
          result.warnings.push({
            message: `Do not manipulate the id-comment on '${table.schema}.${table.name}.${column.name}'. [fixed]`,
            meta: {
              tableId: table.id,
              columnId: column.id,
            },
          });
        }
      });

      // If not found we can drop the column
      if (columnProceeded !== true) {
        if (columnInfo.type != null) {
          const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(columnInfo.type);
          if (columnExtension != null && columnExtension.cleanUp != null) {
            const columnExtensionDeleteContext: IColumnExtensionDeleteContext = {
              schema,
              table,
            };
            const deleteColumnResult: IGqlMigrationResult = await columnExtension.cleanUp(
              columnExtensionDeleteContext,
              columnInfo,
              dbClient,
              gqlMigrationContext
            );
            mergeResult(deleteColumnResult);
          }
        }
        result.commands.push({
          sqls: [
            `ALTER TABLE "${columnInfo.table_schema}"."${columnInfo.table_name}" DROP COLUMN "${columnInfo.column_name}";`,
          ],
          operationSortPosition: OPERATION_SORT_POSITION.DROP_COLUMN,
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
            columnIndex,
          };
          const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(column.type);
          if (columnExtension == null) {
            throw new Error(`Could not find columnExtension for type ${column.type} in column ${column.id}`);
          }

          const createColumnResult: IGqlMigrationResult = await columnExtension.create(
            columnExtensionContext,
            dbClient,
            gqlMigrationContext
          );
          mergeResult(createColumnResult);
          result.commands.push({
            sqls: [
              `COMMENT ON COLUMN "${table.schema}"."${table.name}"."${columnExtension.getPgColumnName(
                columnExtensionContext
              )}" IS '${ONE_PREFIX}${column.id}_${column.type}_Your own comment';`,
            ],
            description: `Add id-comment on column '${table.schema}.${table.name}.${columnExtension.getPgColumnName(
              columnExtensionContext
            )}'.`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT,
          });
        } catch (err) {
          result.errors.push({
            message: `Error on add column of '${table.schema}.${table.name}.${column.name}': ${err.message}`,
            error: err,
            meta: {
              tableId: table.id,
              columnId: column.id,
            },
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
          column: updateColumn.column,
        };
        const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(updateColumn.column.type);
        if (columnExtension == null) {
          throw new Error(
            `Could not find columnExtension for type ${updateColumn.column.type} in column ${updateColumn.column.id}`
          );
        }

        // Rename column
        if (columnExtension.getPgColumnName(columnExtensionContext) !== updateColumn.columnInfo.column_name) {
          const tempColumnName: string = `_one_temp_${updateColumn.column.id}`;
          result.commands.push({
            sqls: [
              `ALTER TABLE ${getPgRegClass(table)} RENAME COLUMN "${
                updateColumn.columnInfo.column_name
              }" TO "${tempColumnName}";`,
            ],
            operationSortPosition: OPERATION_SORT_POSITION.RENAME_COLUMN - 1,
          });
          result.commands.push({
            sqls: [
              `ALTER TABLE ${getPgRegClass(
                table
              )} RENAME COLUMN "${tempColumnName}" TO "${columnExtension.getPgColumnName(columnExtensionContext)}";`,
            ],
            operationSortPosition: OPERATION_SORT_POSITION.RENAME_COLUMN + 1,
          });
        }

        // Check if the type has changed
        if (updateColumn.columnInfo.type != null && updateColumn.columnInfo.type !== updateColumn.column.type) {
          // Type has changed. Run cleanUp on old type if available
          const formerColumnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(
            updateColumn.columnInfo.type
          );
          if (formerColumnExtension != null && formerColumnExtension.cleanUp != null) {
            const columnExtensionCleanUpContext: IColumnExtensionDeleteContext = {
              schema,
              table,
            };
            const cleanUpResult: IGqlMigrationResult = await formerColumnExtension.cleanUp(
              columnExtensionCleanUpContext,
              updateColumn.columnInfo,
              dbClient,
              gqlMigrationContext
            );
            mergeResult(cleanUpResult);
          }
          result.commands.push({
            sqls: [
              `COMMENT ON COLUMN "${table.schema}"."${table.name}"."${columnExtension.getPgColumnName(
                columnExtensionContext
              )}" IS '${ONE_PREFIX}${updateColumn.column.id}_${updateColumn.column.type}_${
                updateColumn.columnInfo.userComment || "Your own comment"
              }';`,
            ],
            description: `Fix column id-comment of "${table.schema}"."${table.name}"."${updateColumn.column.name}".`,
            operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT,
          });
        }

        // Alter column type/constraints/whatever
        const updateColumnResult: IGqlMigrationResult = await columnExtension.update(
          columnExtensionContext,
          updateColumn.columnInfo,
          dbClient,
          gqlMigrationContext
        );
        mergeResult(updateColumnResult);
      } catch (e) {
        result.errors.push({
          message: `Error on update column of '${table.schema}.${table.name}.${updateColumn.column.name}': ${e.message}`,
          meta: {
            tableId: table.id,
            columnId: updateColumn.column.id,
          },
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
    gqlMigrationContext: IGqlMigrationContext
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };
    const mergeResult: (newResult: IGqlMigrationResult) => void = createMergeResultFunction(result);
    // Drop all columns
    await asyncForEach(columnsInfo, async (columnInfo: IColumnInfo) => {
      if (columnInfo.id != null) {
        if (columnInfo.type) {
          const columnExtension: IColumnExtension | null = helpers.getColumnExtensionByType(columnInfo.type);
          if (columnExtension != null && columnExtension.cleanUp != null) {
            const columnExtensionDeleteContext: IColumnExtensionDeleteContext = {
              schema,
              table: tableMeta,
            };
            const deleteColumnResult: IGqlMigrationResult = await columnExtension.cleanUp(
              columnExtensionDeleteContext,
              columnInfo,
              dbClient,
              gqlMigrationContext
            );
            mergeResult(deleteColumnResult);
          }
        }
        result.commands.push({
          sqls: [
            `ALTER TABLE "${columnInfo.table_schema}"."${columnInfo.table_name}" DROP COLUMN "${columnInfo.column_name}";`,
          ],
          operationSortPosition: OPERATION_SORT_POSITION.DROP_COLUMN,
        });
      }
    });

    return result;
  },
};
