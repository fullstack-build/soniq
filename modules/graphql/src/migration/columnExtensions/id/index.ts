import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IQueryFieldData,
  IMutationFieldData,
  IColumnExtension,
} from "../IColumnExtension";
import { getPgRegClass, getPgSelector } from "../../helpers";
import { ICompiledExpression } from "../../ExpressionCompiler";
import { IDbMutationColumn, IDbMutation } from "../../DbSchemaInterface";
import { OPERATION_SORT_POSITION } from "soniq";

export interface IFixedGenericTypes {
  type: string;
  pgDataType: string;
  gqlType: string;
  gqlInputType: string;
  tsType: string;
  tsInputType: string;
}

export const columnExtensionId: IColumnExtension = {
  type: "id",
  getPropertiesDefinition: () => {
    return {
      definitions: {},
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://example.com/root.json",
      type: "object",
      title: "Id Column Properties",
      additionalProperties: false,
    };
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName: (): string => {
    return "id";
  },
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (expressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (expressionId: string) => ICompiledExpression
  ): IQueryFieldData => {
    return {
      field: `id: ID`,
      fieldName: "id",
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector("id")}`,
      pgRootSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector("id")}`,
      viewColumnName: "id",
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
      canBeFilteredAndOrdered: true,
      queryFieldMeta: {},
    };
  },
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ): IMutationFieldData => {
    const isRequired: boolean =
      mutationColumn.isRequired === true || mutation.type === "UPDATE" || mutation.type === "DELETE";

    return {
      fieldType: isRequired === true ? "ID!" : "ID",
    };
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    const sqls: string[] = [
      `ALTER TABLE ${getPgRegClass(
        context.table
      )} ADD COLUMN "id" uuid DEFAULT _graphql_meta.uuid_generate_v4(), ADD PRIMARY KEY ("id");`,
    ];

    return {
      errors: [],
      warnings: [],
      commands: [
        {
          sqls,
          operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN - 100,
        },
      ],
    };
  },
  update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };

    if (columnInfo.data_type !== "uuid") {
      result.errors.push({ message: "Id column is no uuid." });
    }
    if (columnInfo.is_nullable.toUpperCase() === "YES") {
      result.errors.push({ message: "Id column is nullable." });
    }
    if (columnInfo.column_default !== "_graphql_meta.uuid_generate_v4()") {
      result.errors.push({
        message: "Id column has not _graphql_meta.uuid_generate_v4() as default.",
      });
    }

    return result;
  },
  cleanUp: async (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: [
        {
          sqls: [`ALTER TABLE ${getPgRegClass(context.table)} DROP COLUMN "id";`],
          operationSortPosition: OPERATION_SORT_POSITION.DROP_COLUMN + 100,
        },
      ],
    };
  },
};
