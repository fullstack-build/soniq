import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import { IColumnExtensionContext, IPropertieValidationResult, IColumnExtension, IQueryFieldData, IMutationFieldData } from "../IColumnExtension";
import { getPgRegClass, getPgSelector } from "../../helpers";
import { ICompiledExpression } from "../../ExpressionCompiler";
import { IDbMutationColumn, IDbMutation } from "../../DbSchemaInterface";
import { OPERATION_SORT_POSITION } from "@fullstack-one/core";

export interface IFixedGenericTypes {
  type: string;
  pgDataType: string;
  gqlType: string;
  gqlInputType: string;
  tsType: string;
  tsInputType: string;
}

export const columnExtensionUpdatedAt: IColumnExtension = {
  type: "updatedAt",
  validateProperties: (context: IColumnExtensionContext) => {
    const result: IPropertieValidationResult = {
      errors: [],
      warnings: []
    };

    if (context.column.properties != null) {
      result.errors.push({
        message: `The type 'updatedAt' has no properties. See '${context.table.schema}.${context.table.name}.${context.column.name}''.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    }
    if (context.column.name !== "updatedAt") {
      result.errors.push({
        message: `The column of type 'updatedAt' has to be named "updatedAt". See '${context.table.schema}.${context.table.name}.${context.column.name}''.`,
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
    throw new Error("Column-type updatedAt cannot be mutated.");
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
      result.errors.push({ message: "UpdatedAt column is not timestamp without time zone." });
    }
    if (columnInfo.is_nullable.toUpperCase() === "YES") {
      result.errors.push({ message: "UpdatedAt column is nullable." });
    }
    if (columnInfo.column_default !== "timezone('utc'::text, now())") {
      result.errors.push({ message: "UpdatedAt column default is not 'timezone('utc'::text, now())'." });
    }

    return result;
  }
};
