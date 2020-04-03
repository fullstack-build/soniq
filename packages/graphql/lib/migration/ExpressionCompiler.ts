import {
  IDbExpression,
  IDbTable,
  IDbAppliedExpression,
  IDbInputPlaceholder,
  IDbColumn,
  IDbSchema,
  IDbStaticPlaceholder,
  IDbExpressionPlaceholder
} from "./DbSchemaInterface";
import { getPgSelector, getPgRegClass } from "./helpers";
import { IColumnExtension, IColumnExtensionContext } from "./columnExtensions/IColumnExtension";
import { IHelpers } from "./schemaExtensions/ISchemaExtension";
import { template } from "lodash";

export class ExpressionCompiler {
  private compiledExpressions: ICompiledExpressions = {};
  private expressionsById: IExpressionsById = {};
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
    });

    this.schema = schema;
    this.table = table;
    this.helpers = helpers;
    this.localTableAlias = localTableAlias;
    this.generateDirectExpressions = generateDirectExpressions;

    const appliedExpressions = table.appliedExpressions || [];

    appliedExpressions.forEach((appliedExpression) => {
      this.compileExpression(appliedExpression);
    });
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

  private getAppliedExpressionKey(appliedExpression: IDbAppliedExpression) {
    return `${appliedExpression.expressionId}=>${JSON.stringify(appliedExpression.params)}`;
  }

  private compileExpression(appliedExpression: IDbAppliedExpression) {
    if (this.expressionsById[appliedExpression.expressionId] == null) {
      throw new Error(`Expression '${appliedExpression.expressionId}' does not exist.`);
    }

    const appliedExpressionKey = this.getAppliedExpressionKey(appliedExpression);

    if (this.compiledExpressions[appliedExpressionKey] != null) {
      if (this.compiledExpressions[appliedExpressionKey].appliedExpressionIds.indexOf(appliedExpression.id) < 0) {
        this.compiledExpressions[appliedExpressionKey].appliedExpressionIds.push(appliedExpression.id);
      }
      return this.compiledExpressions[appliedExpressionKey];
    }

    const placeholders = {};
    const requiredCompiledExpressionNames: string[] = [];
    const expression = this.expressionsById[appliedExpression.expressionId];
    let authRequired: boolean = expression.authRequired === true;

    const setPlaceholder = (key: string, value: any) => {
      if (placeholders[key] != null) {
        throw new Error(`Placeholder key '${key}' is used more than once in expression ${expression.id}.`);
      }
      placeholders[key] = value;
    };

    let highestSortPosition = 0;

    expression.placeholders.forEach((placeholder) => {
      const type = placeholder.type;
      switch (type) {
        case "INPUT":
          const inputPlaceholder = placeholder as IDbInputPlaceholder;
          if (appliedExpression.params[placeholder.key] == null) {
            throw new Error(
              `InputPlaceholder '${placeholder.key}' is not defined for expression ${expression.id} in applied expression ${appliedExpression.id}.`
            );
          }
          if (inputPlaceholder.inputType === "STRING") {
            setPlaceholder(placeholder.key, appliedExpression.params[placeholder.key]);
            break;
          }
          if (inputPlaceholder.inputType === "FOREIGN_TABLE") {
            setPlaceholder(placeholder.key, this.getTableMetaById(appliedExpression.params[placeholder.key]));
            break;
          }
          if (inputPlaceholder.inputType === "FOREIGN_COLUMN") {
            setPlaceholder(placeholder.key, this.getColumnMetaById(appliedExpression.params[placeholder.key]));
            break;
          }
          if (inputPlaceholder.inputType === "LOCAL_COLUMN") {
            const column = this.getColumnMetaById(appliedExpression.params[placeholder.key]);

            column.columnSelector = `${getPgSelector(this.localTableAlias)}.${getPgSelector(column.columnName)}`;

            setPlaceholder(placeholder.key, column);
            break;
          }
          throw new Error(`InputPlaceholder '${placeholder.key}' has an invalid inputType '${inputPlaceholder.inputType}'.`);
        case "STATIC":
          const staticPlaceholder = placeholder as IDbStaticPlaceholder;
          if (staticPlaceholder.value == null) {
            throw new Error(`StaticPlaceholder '${placeholder.key}' has no value for expression ${expression.id}.`);
          }
          if (staticPlaceholder.inputType === "FOREIGN_TABLE") {
            setPlaceholder(placeholder.key, this.getTableMetaById(staticPlaceholder.value));
            break;
          }
          if (staticPlaceholder.inputType === "FOREIGN_COLUMN") {
            setPlaceholder(placeholder.key, this.getColumnMetaById(staticPlaceholder.value));
            break;
          }
          if (staticPlaceholder.inputType === "LOCAL_COLUMN") {
            const column = this.getColumnMetaById(staticPlaceholder.value);
            if (expression.localTableId == null || expression.localTableId !== column.tableId || expression.localTableId !== this.table.id) {
              throw new Error(
                `StaticPlaceholder '${placeholder.key}' in expression ${expression.id} in applied expression ${appliedExpression.id}: localColumn must exist in localTable and match the used table.`
              );
            }

            column.columnSelector = `${getPgSelector(this.localTableAlias)}.${getPgSelector(column.columnName)}`;

            setPlaceholder(placeholder.key, column);
            break;
          }
          throw new Error(`StaticPlaceholder '${placeholder.key}' has an invalid inputType '${inputPlaceholder.inputType}'.`);
        case "EXPRESSION":
          const expressionPlaceholder = placeholder as IDbExpressionPlaceholder;
          if (expressionPlaceholder.appliedExpression == null) {
            throw new Error(`ExpressionPlaceholder '${placeholder.key}' has no appliedExpression for expression ${expression.id}.`);
          }
          const compiledExpression = this.compileExpression(expressionPlaceholder.appliedExpression);

          if (compiledExpression.sortPosition + 1 > highestSortPosition) {
            highestSortPosition = compiledExpression.sortPosition + 1;
          }

          compiledExpression.requiredCompiledExpressionNames.forEach((compiledExpressionName) => {
            requiredCompiledExpressionNames.push(compiledExpressionName);
          });

          if (compiledExpression.authRequired === true) {
            authRequired = true;
          }

          requiredCompiledExpressionNames.push(compiledExpression.name);

          setPlaceholder(placeholder.key, this.generateDirectExpressions === true ? compiledExpression.renderedSql : compiledExpression.alias);
          break;
        default:
          throw new Error(`Placeholder type '${type}' does not exist on expression '${expression.id}'.`);
      }
    });

    const name = appliedExpression.name;

    Object.values(this.compiledExpressions).forEach((compiledExpression) => {
      if (compiledExpression.name === name) {
        throw new Error(`Duplicate applied-expression names: '${name}' in expression '${expression.id}'`);
      }
    });

    const renderedSql = template(expression.sqlTemplate, {})(placeholders);
    let sql = expression.placeholders.length > 0 ? "LATERAL " : "";
    sql += `(SELECT ${renderedSql} AS "${name}") AS "${name}"`;

    this.compiledExpressions[appliedExpressionKey] = {
      name,
      alias: `${getPgSelector(name)}.${getPgSelector(name)}`,
      sql,
      renderedSql,
      gqlReturnType: expression.gqlReturnType,
      authRequired,
      excludeFromWhereClause: expression.excludeFromWhereClause === true,
      appliedExpressionIds: [appliedExpression.id],
      sortPosition: highestSortPosition,
      requiredCompiledExpressionNames
    };

    if (renderedSql.toUpperCase() === "TRUE" || renderedSql.toUpperCase() === "FALSE") {
      this.compiledExpressions[appliedExpressionKey].directBooleanResult = renderedSql.toUpperCase() === "TRUE";
    }

    return this.compiledExpressions[appliedExpressionKey];
  }

  public getCompiledExpressionById(id: string): ICompiledExpression {
    const keys = Object.keys(this.compiledExpressions);
    for (const index in keys) {
      if (keys.hasOwnProperty(index)) {
        const key = keys[index];
        if (this.compiledExpressions[key].appliedExpressionIds.indexOf(id) >= 0) {
          return this.compiledExpressions[key];
        }
      }
    }
    throw new Error(`Could not find applied expression '${id}'.`);
  }

  public getCompiledExpressionByName(name: string): ICompiledExpression {
    const keys = Object.keys(this.compiledExpressions);
    for (const index in keys) {
      if (keys.hasOwnProperty(index)) {
        const key = keys[index];
        if (this.compiledExpressions[key].name === name) {
          return this.compiledExpressions[key];
        }
      }
    }
    throw new Error(`Could not find compiled expression '${name}'.`);
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

export interface ICompiledExpressions {
  [key: string]: ICompiledExpression;
}

export interface ICompiledExpression {
  name: string;
  alias: string;
  sql: string;
  renderedSql: string;
  gqlReturnType: string;
  authRequired: boolean;
  sortPosition: number;
  excludeFromWhereClause: boolean;
  appliedExpressionIds: string[];
  requiredCompiledExpressionNames: string[];
  directBooleanResult?: boolean | null;
  directRequired?: boolean | null;
}

export interface IExpressionInputObject<TParams = any> {
  name: string;
  params?: TParams;
}

export type IExpressionInput<TParams = any> = IExpressionInputObject<TParams> | string | Array<IExpressionInputObject<TParams> | string>;
