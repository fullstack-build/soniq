import {
  IDbExpression,
  IDbTable,
  IDbColumn,
  IDbSchema,
  IDbExpressionVariable,
  IDbColumnIdVariable,
  IDbColumnNameVariable
} from "./DbSchemaInterface";
import { getPgSelector, getPgRegClass } from "./helpers";
import { IColumnExtension, IColumnExtensionContext } from "./columnExtensions/IColumnExtension";
import { IHelpers } from "./schemaExtensions/ISchemaExtension";
import { template } from "lodash";

export class ExpressionCompiler {
  private compiledExpressions: ICompiledExpressions = {};
  private expressionsById: IExpressionsById = {};
  private expressionsByName: IExpressionsById = {};
  private schema: IDbSchema;
  private table: IDbTable;
  private helpers: IHelpers;
  private localTableAlias: string;
  private generateDirectExpressions: boolean;

  constructor(schema: IDbSchema, table: IDbTable, helpers: IHelpers, localTableAlias: string, generateDirectExpressions: boolean) {
    const expressions = schema.expressions || [];

    expressions.forEach((expression: IDbExpression) => {
      if (this.expressionsById[expression.id] != null) {
        throw new Error(`Expression '${expression.id}' is defined at least twice.`);
      }
      this.expressionsById[expression.id] = expression;

      if (this.expressionsByName[expression.name] != null) {
        throw new Error(`Expression with name '${expression.name}' is defined at least twice.`);
      }
      this.expressionsByName[expression.name] = expression;
    });

    this.schema = schema;
    this.table = table;
    this.helpers = helpers;
    this.localTableAlias = localTableAlias;
    this.generateDirectExpressions = generateDirectExpressions;
  }

  private getTableMetaById(tableId: string): IPlaceholderTable {
    for (const i in this.schema.tables) {
      if (this.schema.tables.hasOwnProperty(i)) {
        const table = this.schema.tables[i];
        if (table.id === tableId) {
          return {
            tableId,
            tableName: table.name,
            tableSchema: table.schema,
            tableNamePgSelector: getPgSelector(table.name),
            tableSchemaPgSelector: getPgSelector(table.schema),
            tablePgRegClass: getPgRegClass(table)
          };
        }
      }
    }
    throw new Error(`Could not find table '${tableId}'.`);
  }

  private getPgColumnNameExtension(table: IDbTable, column: IDbColumn): string {
    const columnExtension = this.helpers.getColumnExtensionByType(column.type);
    if (columnExtension == null) {
      throw new Error(`Could not find columnExtension for type '${column.type}' at column '${column.id}' in table '${table.id}'.`);
    }

    const columnExtensionContext: IColumnExtensionContext = {
      schema: this.schema,
      table,
      column
    };

    return columnExtension.getPgColumnName(columnExtensionContext);
  }

  private getColumnMetaById(columnId: string): IPlaceholderColumn {
    for (const i in this.schema.tables) {
      if (this.schema.tables.hasOwnProperty(i)) {
        const table = this.schema.tables[i];
        for (const j in table.columns) {
          if (table.columns.hasOwnProperty(j)) {
            const column = table.columns[j];
            const pgColumnName = this.getPgColumnNameExtension(table, column);
            if (column.id === columnId) {
              return {
                tableId: table.id,
                tableName: table.name,
                tableSchema: table.schema,
                tableNamePgSelector: getPgSelector(table.name),
                tableSchemaPgSelector: getPgSelector(table.schema),
                tablePgRegClass: getPgRegClass(table),
                columnId,
                columnName: pgColumnName,
                columnSelector: getPgSelector(pgColumnName)
              };
            }
          }
        }
      }
    }
    throw new Error(`Could not find column '${columnId}'.`);
  }

  public compileExpression(expressionId: string): ICompiledExpression {
    if (this.expressionsById[expressionId] == null) {
      throw new Error(`Expression '${expressionId}' does not exist.`);
    }

    if (this.compiledExpressions[expressionId] != null) {
      return this.compiledExpressions[expressionId];
    }

    const variables = {};
    const requiredExpressionIds: string[] = [];
    const expression = this.expressionsById[expressionId];
    let authRequired: boolean = expression.authRequired === true;

    const setPlaceholder = (key: string, value: any) => {
      if (variables[key] != null) {
        throw new Error(`Placeholder key '${key}' is used more than once in expression ${expression.id}.`);
      }
      variables[key] = value;
    };

    let highestSortPosition = 0;

    expression.variables.forEach((placeholder) => {
      const type = placeholder.type;
      switch (type) {
        case "COLUMN_ID":
          const columnIdPlaceholder = placeholder as IDbColumnIdVariable;
          const column = this.getColumnMetaById(columnIdPlaceholder.columnId);
          if (column.tableId !== this.table.id) {
            throw new Error(
              `ColumnIdPlaceholder '${placeholder.key}' in expression ${expression.id}: The column must exist in the table the expression is used.`
            );
          }

          column.columnSelector = `${getPgSelector(this.localTableAlias)}.${getPgSelector(column.columnName)}`;

          setPlaceholder(placeholder.key, column.columnSelector);
          break;
        case "COLUMN_NAME":
          const columnNamePlaceholder = placeholder as IDbColumnNameVariable;

          const columnSelector = `${getPgSelector(this.localTableAlias)}.${getPgSelector(columnNamePlaceholder.columnName)}`;

          setPlaceholder(placeholder.key, columnSelector);
          break;
        case "EXPRESSION":
          const expressionPlaceholder = placeholder as IDbExpressionVariable;
          if (expressionPlaceholder.expressionId == null) {
            throw new Error(`ExpressionPlaceholder '${placeholder.key}' has no expressionId for expression ${expression.id}.`);
          }
          const compiledExpression = this.compileExpression(expressionPlaceholder.expressionId);

          if (compiledExpression.sortPosition + 1 > highestSortPosition) {
            highestSortPosition = compiledExpression.sortPosition + 1;
          }

          compiledExpression.requiredExpressionIds.forEach((expId) => {
            requiredExpressionIds.push(expId);
          });

          if (compiledExpression.authRequired === true) {
            authRequired = true;
          }

          requiredExpressionIds.push(expressionId);

          setPlaceholder(placeholder.key, this.generateDirectExpressions === true ? compiledExpression.renderedSql : compiledExpression.alias);
          break;
        default:
          throw new Error(`Placeholder type '${type}' does not exist on expression '${expression.id}'.`);
      }
    });

    const name = expression.name;

    const renderedSql = template(expression.sqlTemplate, {})(variables);
    let sql = expression.variables.length > 0 ? "LATERAL " : "";
    sql += `(SELECT ${renderedSql} AS "${name}") AS "${name}"`;

    this.compiledExpressions[expressionId] = {
      id: expressionId,
      name,
      alias: `${getPgSelector(name)}.${getPgSelector(name)}`,
      sql,
      renderedSql,
      gqlReturnType: expression.gqlReturnType,
      authRequired,
      excludeFromWhereClause: expression.excludeFromWhereClause === true,
      sortPosition: highestSortPosition,
      requiredExpressionIds
    };

    if (renderedSql.toUpperCase() === "TRUE" || renderedSql.toUpperCase() === "FALSE") {
      this.compiledExpressions[expressionId].directBooleanResult = renderedSql.toUpperCase() === "TRUE";
    }

    return this.compiledExpressions[expressionId];
  }
}

export function orderExpressions(a: ICompiledExpression, b: ICompiledExpression) {
  if (a.sortPosition > b.sortPosition) {
    return 1;
  }
  if (a.sortPosition < b.sortPosition) {
    return -1;
  }
  return 0;
}

export interface IPlaceholderTable {
  tableId: string;
  tableName: string;
  tableSchema: string;
  tableNamePgSelector: string;
  tableSchemaPgSelector: string;
  tablePgRegClass: string;
}

export interface IPlaceholderColumn extends IPlaceholderTable {
  columnId: string;
  columnName: string;
  columnSelector: string;
}

export interface IExpressionsById {
  [id: string]: IDbExpression;
}

export interface IExpressionsByName {
  [name: string]: IDbExpression;
}

export interface ICompiledExpressions {
  [key: string]: ICompiledExpression;
}

export interface ICompiledExpression {
  id: string;
  name: string;
  alias: string;
  sql: string;
  renderedSql: string;
  gqlReturnType: string;
  authRequired: boolean;
  sortPosition: number;
  excludeFromWhereClause: boolean;
  requiredExpressionIds: string[];
  directBooleanResult?: boolean | null;
  directRequired?: boolean | null;
}

export interface IExpressionInputObject<TParams = any> {
  name: string;
  params?: TParams;
}

export type IExpressionInput<TParams = any> = IExpressionInputObject<TParams> | string | Array<IExpressionInputObject<TParams> | string>;
