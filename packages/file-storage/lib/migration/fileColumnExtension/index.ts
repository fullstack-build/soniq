import {
  IDbMutationColumn,
  IDbMutation,
  ICompiledExpression,
  getPgRegClass,
  getPgSelector,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData,
  IColumnInfo,
  IGqlMigrationResult,
  IColumnExtension
} from "@fullstack-one/graphql";
import { OPERATION_SORT_POSITION, ICommand, PoolClient } from "@fullstack-one/core";
import { IFileColumn } from "../filePostProcessingExtension/queryHelper";

export const columnExtensionFile: IColumnExtension = {
  type: "file",
  getPropertiesDefinition: () => {
    return {
      definitions: {},
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://example.com/root.json",
      type: "object",
      title: "ManyToOne Column Properties",
      required: [],
      properties: {
        types: {
          $id: "#/properties/types",
          type: "array",
          title: "ENUM_VALUES",
          uniqueItems: true,
          items: {
            $id: "#/properties/types/items",
            type: "string",
            title: "A file-type",
            default: "DEFAULT",
            examples: ["DEFAULT"],
            pattern: "^(.*)$"
          }
        },
        nullable: {
          $id: "#/properties/nullable",
          type: "boolean",
          title: "Is column nullable or not",
          default: true,
          examples: [true]
        },
        defaultExpression: {
          $id: "#/properties/defaultExpression",
          type: "string",
          title: "The default value of the column as pg expression",
          default: null,
          examples: ["'foobar'::text"],
          pattern: "^(.*)$"
        }
      },
      additionalProperties: false
    };
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName: (context: IColumnExtensionContext): string => {
    return context.column.name;
  },
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (expressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (expressionId: string) => ICompiledExpression
  ): IQueryFieldData => {
    return {
      field: `${context.column.name}: [BucketFile!]`,
      fieldName: context.column.name,
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(context.column.name)}`,
      pgRootSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(context.column.name)}`,
      viewColumnName: context.column.name,
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
      canBeFilteredAndOrdered: false,
      queryFieldMeta: {},
      resolvers: [
        {
          key: "@fullstack-one/file-storage/readFiles",
          path: `${context.table.name}.${context.column.name}`,
          config: {}
        }
      ]
    };
  },
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ): IMutationFieldData => {
    const isNullable = context.column.properties != null && context.column.properties.nullable === true;
    const hasDefault = context.column.properties != null && context.column.properties.defaultExpression != null;
    const isRequired = mutationColumn.isRequired === true || (isNullable !== true && hasDefault !== true);

    return {
      fieldType: isRequired === true ? "[String!]!" : "[String!]"
    };
  },
  create: async (context: IColumnExtensionContext, pgClient: PoolClient, gqlMigrationContext: any): Promise<IGqlMigrationResult> => {
    let sql = `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN ${getPgSelector(context.column.name)} jsonb`;

    if (context.column.properties == null || context.column.properties.nullable !== true) {
      sql += ` NOT NULL`;
    }

    if (context.column.properties != null && context.column.properties.defaultExpression != null) {
      sql += ` DEFAULT ${context.column.properties.defaultExpression}`;
    }

    sql += ";";

    const types = context.column.properties != null && context.column.properties.types != null ? context.column.properties.types : ["DEFAULT"];
    types.sort();

    if (gqlMigrationContext.fileStorageColumns == null) {
      gqlMigrationContext.fileStorageColumns = [];
    }

    const fileColumn: IFileColumn = {
      id: null,
      schemaName: context.table.schema,
      tableName: context.table.name,
      columnName: context.column.name,
      types
    };

    gqlMigrationContext.fileStorageColumns.push(fileColumn);

    return {
      errors: [],
      warnings: [],
      commands: [
        {
          sqls: [sql],
          operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN + (context.columnIndex != null ? context.columnIndex / 100 : 0)
        }
      ]
    };
  },
  update: async (
    context: IColumnExtensionContext,
    columnInfo: IColumnInfo,
    pgClient: PoolClient,
    gqlMigrationContext: any
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };
    const { column, table } = context;
    const currentlyNullable = columnInfo.is_nullable.toUpperCase() === "YES";
    const currentDefaultExpression = columnInfo.column_default;

    if ((column.properties == null || column.properties.defaultExpression == null) && currentDefaultExpression != null) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${column.name}" DROP DEFAUlT;`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }
    if (
      column.properties != null &&
      column.properties.defaultExpression != null &&
      currentDefaultExpression !== column.properties.defaultExpression
    ) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${column.name}" SET DEFAULT ${column.properties.defaultExpression};`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
        autoSchemaFixes: [
          {
            tableId: table.id,
            columnId: column.id,
            key: "properties.defaultExpression",
            value: currentDefaultExpression
          }
        ]
      });
    }
    if (currentlyNullable !== true && column.properties != null && column.properties.nullable === true) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${column.name}" DROP NOT NULL;`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }
    if (currentlyNullable === true && (column.properties == null || column.properties.nullable !== true)) {
      const sqls = [];
      if (column.properties != null && column.properties.defaultExpression != null) {
        sqls.push(`UPDATE ${getPgRegClass(table)} SET "${column.name}" = ${column.properties.defaultExpression} WHERE "${column.name}" IS NULL;`);
      }

      sqls.push(`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${column.name}" SET NOT NULL;`);
      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }

    const types = context.column.properties != null && context.column.properties.types != null ? context.column.properties.types : ["DEFAULT"];
    types.sort();

    if (gqlMigrationContext.fileStorageColumns == null) {
      gqlMigrationContext.fileStorageColumns = [];
    }

    const fileColumn: IFileColumn = {
      id: null,
      schemaName: context.table.schema,
      tableName: context.table.name,
      columnName: context.column.name,
      types
    };

    gqlMigrationContext.fileStorageColumns.push(fileColumn);

    return result;
  },
  cleanUp: async (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo): Promise<IGqlMigrationResult> => {
    return {
      errors: [],
      warnings: [],
      commands: [
        {
          sqls: [`ALTER TABLE ${getPgRegClass(context.table)} DROP COLUMN "id";`],
          operationSortPosition: OPERATION_SORT_POSITION.DROP_COLUMN + 100
        }
      ]
    };
  }
};
