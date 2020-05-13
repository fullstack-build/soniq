import {
  IDbExpression,
  IDbTable,
  IDbColumn,
  IDbSchema,
  IDbExpressionVariable,
  IDbColumnIdVariable,
  IDbColumnNameVariable,
  IDbVariable,
} from "./DbSchemaInterface";
import { getPgSelector, getPgRegClass } from "./helpers";
import { IColumnExtensionContext, IColumnExtension } from "./columnExtensions/IColumnExtension";
import { IHelpers } from "./schemaExtensions/ISchemaExtension";
import { template } from "lodash";

export class ExpressionCompiler {
  private _compiledExpressions: ICompiledExpressions = {};
  private _expressionsById: IExpressionsById = {};
  private _expressionsByName: IExpressionsById = {};
  private _schema: IDbSchema;
  private _table: IDbTable;
  private _helpers: IHelpers;
  private _localTableAlias: string;
  private _generateDirectExpressions: boolean;

  public constructor(
    schema: IDbSchema,
    table: IDbTable,
    helpers: IHelpers,
    localTableAlias: string,
    generateDirectExpressions: boolean
  ) {
    const expressions: IDbExpression[] = schema.expressions || [];

    expressions.forEach((expression: IDbExpression) => {
      if (this._expressionsById[expression.id] != null) {
        throw new Error(`Expression '${expression.id}' is defined at least twice.`);
      }
      this._expressionsById[expression.id] = expression;

      if (this._expressionsByName[expression.name] != null) {
        throw new Error(`Expression with name '${expression.name}' is defined at least twice.`);
      }
      this._expressionsByName[expression.name] = expression;
    });

    this._schema = schema;
    this._table = table;
    this._helpers = helpers;
    this._localTableAlias = localTableAlias;
    this._generateDirectExpressions = generateDirectExpressions;
  }

  private _getPgColumnNameExtension(table: IDbTable, column: IDbColumn): string | null {
    const columnExtension: IColumnExtension | null = this._helpers.getColumnExtensionByType(column.type);
    if (columnExtension == null) {
      throw new Error(
        `Could not find columnExtension for type '${column.type}' at column '${column.id}' in table '${table.id}'.`
      );
    }

    const columnExtensionContext: IColumnExtensionContext = {
      schema: this._schema,
      table,
      column,
    };

    return columnExtension.getPgColumnName(columnExtensionContext);
  }

  private _getColumnMetaById(columnId: string): IVariableColumn {
    for (const i in this._schema.tables) {
      if (this._schema.tables.hasOwnProperty(i)) {
        const table: IDbTable = this._schema.tables[i];
        for (const column of table.columns) {
          const pgColumnName: string | null = this._getPgColumnNameExtension(table, column);
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
              columnSelector: pgColumnName != null ? getPgSelector(pgColumnName) : null,
            };
          }
        }
      }
    }
    throw new Error(`Could not find column '${columnId}'.`);
  }

  public compileExpression(expressionId: string): ICompiledExpression {
    if (this._expressionsById[expressionId] == null) {
      throw new Error(`Expression '${expressionId}' does not exist.`);
    }

    if (this._compiledExpressions[expressionId] != null) {
      return this._compiledExpressions[expressionId];
    }

    const variables: { [key: string]: string } = {};
    const requiredExpressionIds: string[] = [];
    const expression: IDbExpression = this._expressionsById[expressionId];
    let authRequired: boolean = expression.authRequired === true;

    const setVariable: (key: string, value: string) => void = (key: string, value: string): void => {
      if (variables[key] != null) {
        throw new Error(`Variable key '${key}' is used more than once in expression ${expression.id}.`);
      }
      variables[key] = value;
    };

    let highestSortPosition: number = 0;

    expression.variables.forEach((variable: IDbVariable) => {
      const type: "COLUMN_NAME" | "COLUMN_ID" | "EXPRESSION" = variable.type;
      switch (type) {
        case "COLUMN_ID":
          const columnIdVariable: IDbColumnIdVariable = variable as IDbColumnIdVariable;
          const column: IVariableColumn = this._getColumnMetaById(columnIdVariable.columnId);
          if (column.tableId !== this._table.id) {
            throw new Error(
              `ColumnIdVariable '${variable.key}' in expression ${expression.id}: The column must exist in the table the expression is used.`
            );
          }

          if (column.columnName == null) {
            throw new Error(
              `ColumnIdVariable '${variable.key}' in expression ${expression.id}: The column has no real data in the database.`
            );
          }

          column.columnSelector = `${getPgSelector(this._localTableAlias)}.${getPgSelector(column.columnName)}`;

          setVariable(variable.key, column.columnSelector);
          break;
        case "COLUMN_NAME":
          const columnNameVariable: IDbColumnNameVariable = variable as IDbColumnNameVariable;

          const columnSelector: string = `${getPgSelector(this._localTableAlias)}.${getPgSelector(
            columnNameVariable.columnName
          )}`;

          setVariable(variable.key, columnSelector);
          break;
        case "EXPRESSION":
          const expressionVariable: IDbExpressionVariable = variable as IDbExpressionVariable;
          if (expressionVariable.expressionId == null) {
            throw new Error(
              `ExpressionVariable '${variable.key}' has no expressionId for expression ${expression.id}.`
            );
          }
          const compiledExpression: ICompiledExpression = this.compileExpression(expressionVariable.expressionId);

          if (compiledExpression.sortPosition + 1 > highestSortPosition) {
            highestSortPosition = compiledExpression.sortPosition + 1;
          }

          compiledExpression.requiredExpressionIds.forEach((expId: string) => {
            requiredExpressionIds.push(expId);
          });

          if (compiledExpression.authRequired === true) {
            authRequired = true;
          }

          requiredExpressionIds.push(expressionId);

          setVariable(
            variable.key,
            this._generateDirectExpressions === true ? compiledExpression.renderedSql : compiledExpression.alias
          );
          break;
        default:
          throw new Error(`Variable type '${type}' does not exist on expression '${expression.id}'.`);
      }
    });

    const name: string = expression.name;

    const renderedSql: string = template(expression.sqlTemplate, {})(variables);
    let sql: string = expression.variables.length > 0 ? "LATERAL " : "";
    sql += `(SELECT ${renderedSql} AS "${name}") AS "${name}"`;

    this._compiledExpressions[expressionId] = {
      id: expressionId,
      name,
      alias: `${getPgSelector(name)}.${getPgSelector(name)}`,
      sql,
      renderedSql,
      gqlReturnType: expression.gqlReturnType,
      authRequired,
      excludeFromWhereClause: expression.excludeFromWhereClause === true,
      sortPosition: highestSortPosition,
      requiredExpressionIds,
    };

    if (renderedSql.toUpperCase() === "TRUE" || renderedSql.toUpperCase() === "FALSE") {
      this._compiledExpressions[expressionId].directBooleanResult = renderedSql.toUpperCase() === "TRUE";
    }

    return this._compiledExpressions[expressionId];
  }
}

export function orderExpressions(a: ICompiledExpression, b: ICompiledExpression): number {
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

export interface IVariableColumn extends IPlaceholderTable {
  columnId: string;
  columnName: string | null;
  columnSelector: string | null;
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
