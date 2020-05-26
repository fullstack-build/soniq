import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData,
} from "../IColumnExtension";
import { IDbMutationColumn, IDbMutation, IDbExpression } from "../../DbSchemaInterface";
import * as uuidValidate from "uuid-validate";
import { getPgSelector, findExpressionById, getPgRegClass } from "../../helpers";
import { PoolClient } from "soniq";
import { ICompiledExpression } from "../../ExpressionCompiler";

export interface IComputedColumnProperties {
  expressionId: string;
  moveSelectToQuery?: boolean;
}

export const columnExtensionComputed: IColumnExtension = {
  type: "computed",
  getPropertiesDefinition: () => {
    return {
      definitions: {},
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://example.com/root.json",
      type: "object",
      title: "Computed Column Properties",
      required: ["expressionId"],
      properties: {
        expressionId: {
          $id: "#/properties/expressionId",
          type: "string",
          title: "EXPRESSION",
          description: "An expressionId from the local table",
          default: "",
          examples: ["caa8b54a-eb5e-4134-8ae2-a3946a428ec7"],
          pattern: "^(.*)$",
        },
        moveSelectToQuery: {
          $id: "#/properties/moveSelectToQuery",
          type: "boolean",
          title: "Select the column in QueryBuilder not in view",
          default: false,
          examples: [true, false],
        },
      },
      additionalProperties: false,
    };
  },
  validateProperties: (context: IColumnExtensionContext) => {
    const result: IPropertieValidationResult = {
      errors: [],
      warnings: [],
    };
    const properties: IComputedColumnProperties = context.column.properties || {};

    if (properties.expressionId == null || uuidValidate(properties.expressionId) !== true) {
      result.errors.push({
        message: `The property 'expressionId' must be an uuid on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'computed'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id,
        },
        objectId: context.column.id,
      });
    } else {
      const expression: IDbExpression | null = findExpressionById(context.schema, properties.expressionId);
      if (expression == null) {
        result.errors.push({
          message: `The property 'expressionId' must be a valid and existing expressionId on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'computed'. Could not find it.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id,
          },
          objectId: context.column.id,
        });
      }
    }

    return result;
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName: (context: IColumnExtensionContext): string | null => {
    return null;
  },
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (expressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (expressionId: string) => ICompiledExpression
  ): IQueryFieldData => {
    const moveSelectToQuery: boolean =
      context.column.properties != null && context.column.properties.moveSelectToQuery === true;

    const compiledExpression: ICompiledExpression = getCompiledExpressionById(
      context.column.properties.expressionId,
      moveSelectToQuery !== true
    );
    const directCompiledExpression: ICompiledExpression = getDirectCompiledExpressionById(
      context.column.properties.expressionId
    );

    const queryFieldData: IQueryFieldData = {
      field: `${context.column.name}: ${compiledExpression.gqlReturnType}`,
      fieldName: context.column.name,
      pgSelectExpression: compiledExpression.alias,
      pgRootSelectExpression: directCompiledExpression.renderedSql,
      viewColumnName: context.column.name,
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
      canBeFilteredAndOrdered: false,
      queryFieldMeta: {},
    };

    if (context.column.properties != null && context.column.properties.moveSelectToQuery === true) {
      queryFieldData.pgSelectExpression = `TRUE`;
      queryFieldData.pgRootSelectExpression = `TRUE`;
      queryFieldData.columnSelectExpressionTemplate = `CASE WHEN "{_local_table_}".${getPgSelector(
        context.column.name
      )} IS TRUE THEN (SELECT ${directCompiledExpression.renderedSql.replace(
        /_local_table_/g,
        "_temp_"
      )} FROM ${getPgRegClass(context.table)} _temp_ WHERE _temp_.id = "{_local_table_}".id) ELSE NULL END`;
    }

    return queryFieldData;
  },
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ): IMutationFieldData => {
    throw new Error("Column-type computed cannot be mutated.");
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: [],
    };
  },
  update: async (
    context: IColumnExtensionContext,
    columnInfo: IColumnInfo,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: [],
    };
  },
  cleanUp: async (
    context: IColumnExtensionDeleteContext,
    columnInfo: IColumnInfo,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: [],
    };
  },
};
