import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData,
} from "../IColumnExtension";
import { IDbMutationColumn, IDbMutation, IDbTable, IDbColumn } from "../../DbSchemaInterface";
import * as uuidValidate from "uuid-validate";
import { getPgSelector, findTableColumnInSchemaByColumnId } from "../../helpers";
import { PoolClient } from "soniq";
import { ICompiledExpression } from "../../ExpressionCompiler";

export interface IOneToManyColumnProperties {
  foreignColumnId: string;
}

export const columnExtensionOneToMany: IColumnExtension = {
  type: "oneToMany",
  getPropertiesDefinition: () => {
    return {
      definitions: {},
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://example.com/root.json",
      type: "object",
      title: "OneToMany Column Properties",
      required: ["foreignColumnId"],
      properties: {
        foreignColumnId: {
          $id: "#/properties/foreignColumnId",
          type: "string",
          title: "FOREIGN_COLUMN_MANY_TO_ONE",
          description: "An foreignColumnId another table",
          pattern: "^(.*)$",
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
    const properties: IOneToManyColumnProperties = context.column.properties || {};

    if (uuidValidate(properties.foreignColumnId) !== true) {
      result.errors.push({
        message: `The property 'foreignColumnId' must be an uuid on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'oneToMany'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id,
        },
        objectId: context.column.id,
      });
    } else {
      const foreignRelation: {
        table: IDbTable;
        column: IDbColumn;
      } | null = findTableColumnInSchemaByColumnId(context.schema, properties.foreignColumnId);

      if (foreignRelation == null) {
        result.errors.push({
          message: `Could not find foreignColumnId '${properties.foreignColumnId}' on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'oneToMany'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id,
          },
          objectId: context.column.id,
        });
      } else {
        if (foreignRelation.column.type !== "manyToOne") {
          result.errors.push({
            message: `The foreign column '${properties.foreignColumnId}' of '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'oneToMany' must be type 'manyToOne'.`,
            meta: {
              tableId: context.table.id,
              columnId: context.column.id,
            },
            objectId: context.column.id,
          });
        }
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
    const foreignRelation: {
      table: IDbTable;
      column: IDbColumn;
    } | null = findTableColumnInSchemaByColumnId(context.schema, context.column.properties.foreignColumnId);

    if (foreignRelation == null) {
      throw new Error(
        `Could not find foreigColumnId ${context.column.properties.foreignColumnId} from columnId ${context.column.id}.`
      );
    }

    return {
      field: `${context.column.name}: [${foreignRelation.table.name}!]!`,
      fieldName: context.column.name,
      pgSelectExpression: `TRUE`,
      pgRootSelectExpression: `TRUE`,
      viewColumnName: context.column.name,
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
      canBeFilteredAndOrdered: false,
      queryFieldMeta: {
        oneToMany: {
          foreignColumnName: `${foreignRelation.column.name}Id`,
        },
      },
    };
  },
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ): IMutationFieldData => {
    throw new Error("Column-type oneToMany cannot be mutated.");
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
