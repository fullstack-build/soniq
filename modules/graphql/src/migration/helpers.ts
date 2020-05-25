import { getPgSelector, IMigrationError } from "soniq";
import { IDbSchema, IDbTable, IDbColumn, IDbExpression } from "./DbSchemaInterface";
import { ITableMeta, IGqlMigrationResult, IGqlCommand } from "./interfaces";
import * as uuidValidate from "uuid-validate";

export const ONE_PREFIX: string = "ONE_";

export function findTableById(schema: IDbSchema, tableId: string): IDbTable | null {
  for (const i in schema.tables) {
    if (schema.tables[i].id === tableId) {
      return schema.tables[i];
    }
  }
  return null;
}

export function findColumnById(table: IDbTable, columnId: string): IDbColumn | null {
  for (const column of table.columns) {
    if (column.id === columnId) {
      return column;
    }
  }
  return null;
}

export function findTableColumnInSchemaByColumnId(
  schema: IDbSchema,
  columnId: string
): { table: IDbTable; column: IDbColumn } | null {
  for (const table of schema.tables || []) {
    for (const column of table.columns) {
      if (column.id === columnId) {
        return {
          table,
          column: column,
        };
      }
    }
  }
  return null;
}

export function findExpressionById(schema: IDbSchema, expressionId: string): IDbExpression | null {
  if (schema.expressions != null) {
    for (const expression of schema.expressions) {
      if (expression != null && expression.id === expressionId) {
        return expression;
      }
    }
  }
  return null;
}

export function findColumnByType(table: IDbTable, type: string): IDbColumn | null {
  for (const column of table.columns) {
    if (column.type === type) {
      return column;
    }
  }
  return null;
}

export function getPgRegClass(table: IDbTable | ITableMeta): string {
  return `${getPgSelector(table.schema)}.${getPgSelector(table.name)}`;
}

export { getPgSelector };

export function createMergeResultFunction(result: IGqlMigrationResult): (newResult: IGqlMigrationResult) => void {
  return (newResult: IGqlMigrationResult) => {
    newResult.errors.forEach((error: IMigrationError) => {
      result.errors.push(error);
    });
    newResult.warnings.forEach((warning: IMigrationError) => {
      result.warnings.push(warning);
    });
    newResult.commands.forEach((command: IGqlCommand) => {
      result.commands.push(command);
    });
  };
}

export interface IObjectMeta {
  id: string;
  type: string | null;
  userComment: string | null;
}

export function getObjectMeta(comment: string): IObjectMeta | null {
  if (comment != null && typeof comment === "string" && comment.startsWith(ONE_PREFIX)) {
    const splittedComment: string[] = comment.split("_");
    const id: string = splittedComment[1];
    const type: string = splittedComment[2];
    const userComment: string = splittedComment[3];
    if (uuidValidate(id)) {
      return {
        id,
        type,
        userComment,
      };
    }
  }
  return null;
}
