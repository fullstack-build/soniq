import { getPgSelector } from "@fullstack-one/core";
import { IDbSchema, IDbTable, IDbColumn, IDbAppliedExpression } from "./DbSchemaInterface";
import { ITableMeta, IGqlMigrationResult } from "./interfaces";
import * as uuidValidate from "uuid-validate";

export const ONE_PREFIX = "ONE_";

export const findTableById = (schema: IDbSchema, tableId: string): IDbTable | null => {
  for (const i in schema.tables) {
    if (schema.tables[i].id === tableId) {
      return schema.tables[i];
    }
  }
  return null;
};

export const findColumnById = (table: IDbTable, columnId: string): IDbColumn | null => {
  for (const i in table.columns) {
    if (table.columns[i].id === columnId) {
      return table.columns[i];
    }
  }
  return null;
};

export const findTableColumnInSchemaByColumnId = (schema: IDbSchema, columnId: string): {table: IDbTable, column: IDbColumn} | null => {
  for (const i in schema.tables) {
    const table = schema.tables[i];
    for (const j in table.columns) {
      if (table.columns[j].id === columnId) {
        return {
          table,
          column: table.columns[j]
        };
      }
    }
  }
  return null;
};

export const findAppliedExpressionById = (table: IDbTable, appliendExpressionId: string): IDbAppliedExpression | null => {
  for (const i in table.appliedExpressions || []) {
    if (table.appliedExpressions[i].id === appliendExpressionId) {
      return table.appliedExpressions[i];
    }
  }
  return null;
};

export const findColumnByType = (table: IDbTable, type: string): IDbColumn | null => {
  for (const i in table.columns) {
    if (table.columns[i].type === type) {
      return table.columns[i];
    }
  }
  return null;
};

export const getPgRegClass = (table: IDbTable | ITableMeta): string => {
  return `${getPgSelector(table.schema)}.${getPgSelector(table.name)}`;
};

export { getPgSelector };

export const createMergeResultFunction = (result: IGqlMigrationResult): ((newResult: IGqlMigrationResult) => void) => {
  return (newResult: IGqlMigrationResult) => {
    newResult.errors.forEach((error) => {
      result.errors.push(error);
    });
    newResult.warnings.forEach((warning) => {
      result.warnings.push(warning);
    });
    newResult.commands.forEach((command) => {
      result.commands.push(command);
    });
  };
};

export const getObjectMeta = (comment: string) => {
  if (comment != null && typeof comment === "string" && comment.startsWith(ONE_PREFIX)) {
    const splittedComment = comment.split("_");
    const id = splittedComment[1];
    const type = splittedComment[2];
    const userComment = splittedComment[3];
    if (uuidValidate(id)) {
      return {
        id,
        type,
        userComment
      };
    }
  }
  return null;
};
