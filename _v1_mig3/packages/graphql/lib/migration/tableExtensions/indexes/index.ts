import { IDbSchema, IDbTable, IDbIndex } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgRegClass, createMergeResultFunction, getPgSelector, ONE_PREFIX } from "../../helpers";
import { ITableExtension, IHelpersWithColumnHelper, IColumnData } from "../ITableExtension";
import { IIndex, getIndexes } from "./queryHelper";

export const ONE_INDEX_PREFIX = `${ONE_PREFIX}INDEX_`;

export const tableExtenstionIndexes: ITableExtension = {
  preloadData: async (schema: IDbSchema, dbClient: PoolClient): Promise<IIndex[]> => {
    const indexes = await getIndexes(dbClient, schema.schemas);
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
      commands: []
    };
    const mergeResult = createMergeResultFunction(result);

    const tableIndexes = table.indexes || [];
    const proceededIndexIds = [];

    tableIndexes.forEach((index) => {
      const idValidation = helpers.validateId(index.id);

      if (idValidation != null) {
        result.errors.push({
          message: `ID of check ${index.id} is invalid: ${idValidation}.`,
          meta: {
            indexId: index.id,
            tableId: table.id
          }
        });
      }
      try {
        createIndexDefinition(table, index, helpers);
      } catch (err) {
        result.errors.push({
          message: `Failed to generate index: ${err}.`,
          meta: {
            indexId: index.id,
            tableId: table.id
          }
        });
      }
    });

    if (result.errors.length > 0) {
      return result;
    }

    indexes.forEach((existingIndex) => {
      // Only proceed indexes created by one. Ignoring others
      if (existingIndex.index_name.startsWith(ONE_INDEX_PREFIX)) {
        let foundInSchema: any = false;

        tableIndexes.forEach((index) => {
          const indexName = createIndexName(index.id);

          if (existingIndex.index_name === indexName) {
            proceededIndexIds.push(index.id);
            foundInSchema = true;

            const indexDefinition = createIndexDefinition(table, index, helpers);
            const indexDefinitionWithWhereClause = indexDefinition + (index.condition != null ? createIndexWhereCondition(index.condition) : "");

            const dropSql = `DROP INDEX ${getPgSelector(table.schema)}.${getPgSelector(indexName)};`;
            const createSql = `${indexDefinitionWithWhereClause};`;

            // Check if index-definition has changed
            if (existingIndex.index_def !== indexDefinitionWithWhereClause) {
              const startCheck = `${indexDefinition} WHERE `;

              if (existingIndex.index_def.startsWith(startCheck)) {
                result.commands.push({
                  sqls: [dropSql, createSql],
                  operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
                  autoSchemaFixes: [
                    {
                      tableId: table.id,
                      indexId: index.id,
                      key: "condition",
                      value: existingIndex.index_def.substr(startCheck.length - 1).trim()
                    }
                  ]
                });
              } else {
                result.commands.push({
                  sqls: [dropSql],
                  operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA + 100
                });
                result.commands.push({
                  sqls: [createSql],
                  operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100
                });
              }
            }
          }
        });

        if (foundInSchema !== true) {
          result.commands.push({
            sqls: [`DROP INDEX ${getPgSelector(existingIndex.table_schema)}.${getPgSelector(existingIndex.index_name)};`],
            operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA + 100
          });
        }
      }
    });

    tableIndexes.forEach((index) => {
      if (proceededIndexIds.indexOf(index.id) < 0) {
        const indexDefinition = createIndexDefinition(table, index, helpers);
        const indexDefinitionWithWhereClause = indexDefinition + (index.condition != null ? createIndexWhereCondition(index.condition) : "");
        const createSql = `${indexDefinitionWithWhereClause};`;

        result.commands.push({
          sqls: [createSql],
          operationSortPosition: OPERATION_SORT_POSITION.SET_COMMENT - 100
        });
      }
    });

    return result;
  }
};

const createIndexName = (indexId: string): string => {
  return `${ONE_INDEX_PREFIX}${indexId}`;
};

const getIndexAccessMethod = (indexAccessMethod: string): string => {
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
};

const createIndexDefinition = (table: IDbTable, index: IDbIndex, helpers: IHelpersWithColumnHelper): string => {
  const indexName = createIndexName(index.id);
  const columnList = index.columnIds.map((columnId: string) => {
    const columnData: IColumnData = helpers.getColumnDataByColumnId(columnId);
    if (columnData == null) {
      throw new Error(`Could not find columnId '${columnId}'.`);
    }
    if (columnData.columnExtension == null) {
      throw new Error(`Could not find column type '${columnData.column.type}'.`);
    }
    const pgColumnName = columnData.columnExtension.getPgColumnName(columnData);
    if (pgColumnName == null) {
      throw new Error(`The columnId '${columnId}' has no native pg-column.`);
    }
    return pgColumnName;
  });

  const formattedColumnList = `(${columnList.map(getPgSelector).join(", ")})`;
  const accessMethod = getIndexAccessMethod(index.accessMethod);

  let sql = `CREATE `;

  if (index.isUniqueIndex === true) {
    sql += `UNIQUE `;
  }

  sql += `INDEX ${getPgSelector(indexName)} ON ${getPgRegClass(table)} USING ${accessMethod} ${formattedColumnList}`;

  return sql;
};

const createIndexWhereCondition = (indexCondition: string): string => {
  if (indexCondition[0] !== "(" && indexCondition[indexCondition.length - 1] !== ")") {
    return ` WHERE (${indexCondition})`;
  }
  return ` WHERE ${indexCondition}`;
};
