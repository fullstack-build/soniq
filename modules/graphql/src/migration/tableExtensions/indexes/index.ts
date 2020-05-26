import { IDbSchema, IDbTable, IDbIndex } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgRegClass, getPgSelector, ONE_PREFIX } from "../../helpers";
import { ITableExtension, IHelpersWithColumnHelper, IColumnData } from "../ITableExtension";
import { IIndex, getIndexes } from "./queryHelper";

export const ONE_INDEX_PREFIX: string = `${ONE_PREFIX}INDEX_`;

function createIndexName(indexId: string): string {
  return `${ONE_INDEX_PREFIX}${indexId}`;
}

function getIndexAccessMethod(indexAccessMethod: string | null | undefined): string {
  if (indexAccessMethod == null) {
    return "btree";
  }

  switch (indexAccessMethod) {
    case "btree":
      return "btree";
    case "hash":
      return "hash";
    case "gist":
      return "gist";
    case "gin":
      return "gin";
    case "spgist":
      return "spgist";
    case "brin":
      return "brin";
    default:
      return "btree";
  }
}

function createIndexDefinition(table: IDbTable, index: IDbIndex, helpers: IHelpersWithColumnHelper): string {
  const indexName: string = createIndexName(index.id);
  const columnList: string[] = index.columnIds.map((columnId: string) => {
    const columnData: IColumnData | null = helpers.getColumnDataByColumnId(columnId);
    if (columnData == null) {
      throw new Error(`Could not find columnId '${columnId}'.`);
    }
    if (columnData.columnExtension == null) {
      throw new Error(`Could not find column type '${columnData.column.type}'.`);
    }
    const pgColumnName: string | null = columnData.columnExtension.getPgColumnName(columnData);
    if (pgColumnName == null) {
      throw new Error(`The columnId '${columnId}' has no native pg-column.`);
    }
    return pgColumnName;
  });

  const formattedColumnList: string = `(${columnList.map(getPgSelector).join(", ")})`;
  const accessMethod: string = getIndexAccessMethod(index.accessMethod);

  let sql: string = `CREATE `;

  if (index.isUniqueIndex === true) {
    sql += `UNIQUE `;
  }

  sql += `INDEX ${getPgSelector(indexName)} ON ${getPgRegClass(table)} USING ${accessMethod} ${formattedColumnList}`;

  return sql;
}

function createIndexWhereCondition(indexCondition: string): string {
  if (indexCondition[0] !== "(" && indexCondition[indexCondition.length - 1] !== ")") {
    return ` WHERE (${indexCondition})`;
  }
  return ` WHERE ${indexCondition}`;
}

export const tableExtenstionIndexes: ITableExtension = {
  preloadData: async (schema: IDbSchema, dbClient: PoolClient): Promise<IIndex[]> => {
    const indexes: IIndex[] = await getIndexes(dbClient, schema.schemas);
    return indexes;
  },
  generateCommands: async (
    table: IDbTable,
    dbSchema: IDbSchema,
    indexes: IIndex[],
    helpers: IHelpersWithColumnHelper,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };

    const tableIndexes: IDbIndex[] = table.indexes || [];
    const proceededIndexIds: string[] = [];

    tableIndexes.forEach((index: IDbIndex) => {
      const idValidation: string | null = helpers.validateId(index.id);

      if (idValidation != null) {
        result.errors.push({
          message: `ID of check ${index.id} is invalid: ${idValidation}.`,
          meta: {
            indexId: index.id,
            tableId: table.id,
          },
          objectId: index.id,
        });
      }
      try {
        createIndexDefinition(table, index, helpers);
      } catch (err) {
        result.errors.push({
          message: `Failed to generate index: ${err}.`,
          meta: {
            indexId: index.id,
            tableId: table.id,
          },
          objectId: index.id,
        });
      }
    });

    if (result.errors.length > 0) {
      return result;
    }

    indexes.forEach((existingIndex: IIndex) => {
      // Only proceed indexes created by one. Ignoring others
      if (existingIndex.index_name.startsWith(ONE_INDEX_PREFIX)) {
        let foundInSchema: unknown = false;

        tableIndexes.forEach((index: IDbIndex) => {
          const indexName: string = createIndexName(index.id);

          if (existingIndex.index_name === indexName) {
            proceededIndexIds.push(index.id);
            foundInSchema = true;

            const indexDefinition: string = createIndexDefinition(table, index, helpers);
            const indexDefinitionWithWhereClause: string =
              indexDefinition + (index.condition != null ? createIndexWhereCondition(index.condition) : "");

            const dropSql: string = `DROP INDEX ${getPgSelector(table.schema)}.${getPgSelector(indexName)};`;
            const createSql: string = `${indexDefinitionWithWhereClause};`;

            // Check if index-definition has changed
            if (existingIndex.index_def !== indexDefinitionWithWhereClause) {
              const startCheck: string = `${indexDefinition} WHERE `;

              if (existingIndex.index_def.startsWith(startCheck)) {
                const autoFixValue: string = existingIndex.index_def.substr(startCheck.length - 1).trim();

                result.commands.push({
                  sqls: [dropSql, createSql],
                  operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
                  autoSchemaFixes: [
                    {
                      tableId: table.id,
                      indexId: index.id,
                      key: "condition",
                      value: autoFixValue,
                      message: `Please change the condition of index "${index.id}" to "${autoFixValue}".`,
                    },
                  ],
                });
              } else {
                result.commands.push({
                  sqls: [dropSql],
                  operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA + 100,
                });
                result.commands.push({
                  sqls: [createSql],
                  operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100,
                });
              }
            }
          }
        });

        if (foundInSchema !== true) {
          result.commands.push({
            sqls: [
              `DROP INDEX ${getPgSelector(existingIndex.table_schema)}.${getPgSelector(existingIndex.index_name)};`,
            ],
            operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA + 100,
          });
        }
      }
    });

    tableIndexes.forEach((index: IDbIndex) => {
      if (proceededIndexIds.indexOf(index.id) < 0) {
        const indexDefinition: string = createIndexDefinition(table, index, helpers);
        const indexDefinitionWithWhereClause: string =
          indexDefinition + (index.condition != null ? createIndexWhereCondition(index.condition) : "");
        const createSql: string = `${indexDefinitionWithWhereClause};`;

        result.commands.push({
          sqls: [createSql],
          operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100,
        });
      }
    });

    return result;
  },
};
