import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData
} from "../IColumnExtension";
import { IDbMutationColumn, IDbMutation } from "../../DbSchemaInterface";
import * as uuidValidate from "uuid-validate";
import { findTableById, getPgSelector, findAppliedExpressionById } from "../../helpers";
import { PoolClient } from "@fullstack-one/core";
import { ICompiledExpression } from "../../ExpressionCompiler";

export const columnExtensionComputed: IColumnExtension = {
  type: "computed",
  getPropertiesDefinition: () => {
    return {
      "definitions": {},
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "http://example.com/root.json",
      "type": "object",
      "title": "Computed Column Properties",
      "required": ["appliedExpressionId"],
      "properties": {
        "appliedExpressionId": {
          "$id": "#/properties/appliedExpressionId",
          "type": "string",
          "title": "APPLIED_EXPRESSION",
          "description": "An appliedExpressionId from the local table",
          "default": "",
          "examples": [
            "caa8b54a-eb5e-4134-8ae2-a3946a428ec7"
          ],
          "pattern": "^(.*)$"
        }
      },
      "additionalProperties": false
    };
  },
  validateProperties: (context: IColumnExtensionContext) => {
    const result: IPropertieValidationResult = {
      errors: [],
      warnings: []
    };
    const properties = context.column.properties || {};

    if (uuidValidate(properties.appliedExpressionId) !== true) {
      result.errors.push({
        message: `The property 'appliedExpressionId' must be an uuid on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'computed'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    } else {
      const appliedExpression = findAppliedExpressionById(context.table, properties.appliedExpressionId);
      if (appliedExpression == null) {
        result.errors.push({
          message: `The property 'appliedExpressionId' must be an id defined on the same table on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'computed'. Could not find it.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }

    return result;
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName: (context: IColumnExtensionContext): string => {
    return null;
  },
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (appliedExpressionId) => ICompiledExpression
  ): IQueryFieldData => {
    const compiledExpression = getCompiledExpressionById(context.column.properties.appliedExpressionId);

    return {
      field: `${context.column.name}: ${compiledExpression.gqlReturnType}`,
      fieldName: context.column.name,
      pgSelectExpression: compiledExpression.alias,
      viewColumnName: context.column.name,
      canBeFilteredAndOrdered: false,
      queryFieldMeta: {}
    };
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
      commands: []
    };
  },
  update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: []
    };
  },
  cleanUp: async (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: []
    };
  }
};
