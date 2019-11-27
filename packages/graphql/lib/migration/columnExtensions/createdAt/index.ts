import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import { IColumnExtensionContext, IPropertieValidationResult, IColumnExtension, IMutationFieldData, IQueryFieldData } from "../IColumnExtension";
import { getPgRegClass, getPgSelector } from "../../helpers";
import { IDbMutationColumn, IDbMutation } from "../../DbSchemaInterface";
import { ICompiledExpression } from "../../ExpressionCompiler";
import { OPERATION_SORT_POSITION } from "@fullstack-one/core";

export interface IFixedGenericTypes {
  type: string;
  pgDataType: string;
  gqlType: string;
  gqlInputType: string;
  tsType: string;
  tsInputType: string;
}

export const columnExtensionCreatedAt: IColumnExtension = {
  type: "createdAt",
  validateProperties: (context: IColumnExtensionContext) => {
    const result: IPropertieValidationResult = {
      errors: [],
      warnings: []
    };

    if (context.column.properties != null) {
      result.errors.push({
        message: `The type 'createdAt' has no properties. See '${context.table.schema}.${context.table.name}.${context.column.name}''.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    }
    if (context.column.name !== "createdAt") {
      result.errors.push({
        message: `The column of type 'createdAt' has to be named "createdAt". See '${context.table.schema}.${context.table.name}.${context.column.name}''.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    }

    return result;
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName: (context: IColumnExtensionContext): string => {
    return context.column.name;
  },
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (appliedExpressionId) => ICompiledExpression
  ): IQueryFieldData => {
    return {
      field: `${context.column.name}: String`,
      fieldName: context.column.name,
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(context.column.name)}`,
      viewColumnName: context.column.name,
      canBeFilteredAndOrdered: true,
      queryFieldMeta: {}
    };
  },
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ): IMutationFieldData => {
    throw new Error("Column-type createdAt cannot be mutated.");
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    const sqls = [
      `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN ${getPgSelector(
        context.column.name
      )} timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL;`
    ];

    return {
      errors: [],
      warnings: [],
      commands: [{ sqls, operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN }]
    };
  },
  update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    if (columnInfo.data_type !== "timestamp without time zone") {
      result.errors.push({ message: "CreatedAt column is not timestamp without time zone." });
    }
    if (columnInfo.is_nullable.toUpperCase() === "YES") {
      result.errors.push({ message: "CreatedAt column is nullable." });
    }
    if (columnInfo.column_default !== "timezone('utc'::text, now())") {
      result.errors.push({ message: "CreatedAt column default is not 'timezone('utc'::text, now())'." });
    }

    return result;
  }
};
