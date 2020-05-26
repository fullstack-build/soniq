import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IQueryFieldData,
  IMutationFieldData,
} from "../IColumnExtension";
import { IDbMutation, IDbMutationColumn } from "../../DbSchemaInterface";
import { getPgRegClass, getPgSelector, ONE_PREFIX } from "../../helpers";
import { getEnum } from "./queryHelper";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
// tslint:disable-next-line:no-submodule-imports
import * as uuidv4 from "uuid/v4";
import { ICompiledExpression } from "../../ExpressionCompiler";

export const ONE_ENUM_PREFIX: string = `${ONE_PREFIX}ENUM_`;

function getPgColumnName(context: IColumnExtensionContext): string {
  return context.column.name;
}

export const columnExtensionEnum: IColumnExtension = {
  type: "enum",
  getPropertiesDefinition: () => {
    return {
      definitions: {},
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://example.com/root.json",
      type: "object",
      title: "ManyToOne Column Properties",
      required: ["values"],
      properties: {
        values: {
          $id: "#/properties/values",
          type: "array",
          title: "ENUM_VALUES",
          uniqueItems: true,
          items: {
            $id: "#/properties/values/items",
            type: "string",
            title: "An enum value",
            examples: ["FOO", "BAR"],
            pattern: "^(.*)$",
          },
        },
        nullable: {
          $id: "#/properties/nullable",
          type: "boolean",
          title: "Is column nullable or not",
          default: true,
          examples: [true],
        },
        defaultExpression: {
          $id: "#/properties/defaultExpression",
          type: "string",
          title: "The default value of the column as pg expression",
          default: null,
          examples: ["'foobar'::text"],
          pattern: "^(.*)$",
        },
      },
      additionalProperties: false,
    };
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName,
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (expressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (expressionId: string) => ICompiledExpression
  ): IQueryFieldData => {
    return {
      field: `${getPgColumnName(context)}: Enum_${context.table.name}_${context.column.name}`,
      fieldName: getPgColumnName(context),
      pgRootSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
      viewColumnName: getPgColumnName(context),
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
      canBeFilteredAndOrdered: true,
      queryFieldMeta: {},
      gqlTypeDefs: `\nenum Enum_${context.table.name}_${context.column.name} { \n${context.column.properties.values
        .map((value: string) => value)
        .join(" \n")}\n }\n`,
    };
  },
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ): IMutationFieldData => {
    const isNullable: boolean = context.column.properties != null && context.column.properties.nullable === true;
    const hasDefault: boolean =
      context.column.properties != null && context.column.properties.defaultExpression != null;
    const isRequired: boolean = mutationColumn.isRequired === true || (isNullable !== true && hasDefault !== true);

    return {
      fieldType: `Enum_${context.table.name}_${context.column.name}${isRequired === true ? "!" : ""}`,
    };
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    const enumTypeName: string = `${ONE_ENUM_PREFIX}${context.column.id}_${context.table.schema}`;
    let sql: string = `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN ${getPgSelector(
      getPgColumnName(context)
    )} ${getPgSelector(enumTypeName)}`;

    if (context.column.properties == null || context.column.properties.nullable !== true) {
      sql += ` NOT NULL`;
    }

    if (context.column.properties != null && context.column.properties.defaultExpression != null) {
      sql += ` DEFAULT ${context.column.properties.defaultExpression}`;
    }

    sql += ";";

    return {
      errors: [],
      warnings: [],
      commands: [
        {
          sqls: [
            `DROP TYPE IF EXISTS ${getPgSelector(enumTypeName)};`,
            `CREATE TYPE ${getPgSelector(enumTypeName)} AS ENUM (${context.column.properties.values
              .map((value: string) => {
                return `'${value}'`;
              })
              .join(", ")});`,
            sql,
          ],
          operationSortPosition:
            OPERATION_SORT_POSITION.ADD_COLUMN + (context.columnIndex != null ? context.columnIndex / 100 : 0),
          objectId: context.column.id,
        },
      ],
    };
  },
  update: async (
    context: IColumnExtensionContext,
    columnInfo: IColumnInfo,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    const enumTypeName: string = `${ONE_ENUM_PREFIX}${context.column.id}_${context.table.schema}`;
    const { table, column } = context;
    const pgColumnName: string = getPgColumnName(context);
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };
    const currentlyNullable: boolean = columnInfo.is_nullable.toUpperCase() === "YES";
    const currentDefaultExpression: string = columnInfo.column_default;

    const enumValues: string[] = await getEnum(dbClient, enumTypeName);

    // TODO: TS Sucks with booleans and function-loops
    let hasEnumChanged: unknown = false;

    const removedValues: string[] = [];

    enumValues.forEach((value: string) => {
      if (context.column.properties.values.indexOf(value) < 0) {
        hasEnumChanged = true;
        removedValues.push(value);
      }
    });

    if (hasEnumChanged !== true) {
      context.column.properties.values.forEach((value: string) => {
        if (enumValues.indexOf(value) < 0) {
          hasEnumChanged = true;
        }
      });
    }

    for (const value of removedValues) {
      const { rows } = await dbClient.query(
        `SELECT EXISTS(SELECT ${getPgSelector(getPgColumnName(context))} FROM ${getPgRegClass(
          context.table
        )} WHERE ${getPgRegClass(context.table)}.${getPgSelector(getPgColumnName(context))} = $1 LIMIT 1) "exists";`,
        [value]
      );
      if (rows.length > 0 && rows[0].exists === true) {
        result.errors.push({
          message: `You cannot drop value '${value}' of enum column '${context.column.name}' in table ${getPgRegClass(
            context.table
          )} because there are rows with this value.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id,
          },
          objectId: context.column.id,
        });
      }
    }

    if (
      (column.properties == null || column.properties.defaultExpression == null) &&
      currentDefaultExpression != null
    ) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" DROP DEFAUlT;`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
        objectId: context.column.id,
      });
    }
    if (hasEnumChanged === true) {
      const sqls: string[] = [];
      const tempEnumTypeName: string = `${ONE_ENUM_PREFIX}TEMP_${uuidv4()}`;

      sqls.push(
        `ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN ${getPgSelector(getPgColumnName(context))} DROP DEFAUlT;`
      );
      sqls.push(`ALTER TYPE ${getPgSelector(enumTypeName)} RENAME TO ${getPgSelector(tempEnumTypeName)};`);
      sqls.push(
        `CREATE TYPE ${getPgSelector(enumTypeName)} AS ENUM (${context.column.properties.values
          .map((value: string) => {
            return `'${value}'`;
          })
          .join(", ")});`
      );
      sqls.push(
        `ALTER TABLE ${getPgRegClass(context.table)} ALTER COLUMN ${getPgSelector(getPgColumnName(context))} TYPE text;`
      );
      sqls.push(
        `ALTER TABLE ${getPgRegClass(context.table)} ALTER COLUMN ${getPgSelector(
          getPgColumnName(context)
        )} TYPE ${getPgSelector(enumTypeName)} USING ${getPgSelector(getPgColumnName(context))}::${getPgSelector(
          enumTypeName
        )};`
      );
      sqls.push(`DROP TYPE ${getPgSelector(tempEnumTypeName)};`);

      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
        objectId: context.column.id,
      });
    }
    if (
      column.properties != null &&
      column.properties.defaultExpression != null &&
      (currentDefaultExpression !== column.properties.defaultExpression || hasEnumChanged === true)
    ) {
      result.commands.push({
        sqls: [
          `ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" SET DEFAULT ${
            column.properties.defaultExpression
          };`,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
        autoSchemaFixes: [
          {
            tableId: table.id,
            columnId: column.id,
            key: "properties.defaultExpression",
            value: currentDefaultExpression,
            message: `Please change the defaultExpression of enum-column "${table.schema}"."${table.name}"."${column.name}" to "${currentDefaultExpression}".`,
          },
        ],
        objectId: context.column.id,
      });
    }
    if (currentlyNullable !== true && column.properties != null && column.properties.nullable === true) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" DROP NOT NULL;`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
        objectId: context.column.id,
      });
    }
    if (currentlyNullable === true && (column.properties == null || column.properties.nullable !== true)) {
      const sqls: string[] = [];
      if (column.properties != null && column.properties.defaultExpression != null) {
        sqls.push(
          `UPDATE ${getPgRegClass(table)} SET "${pgColumnName}" = ${
            column.properties.defaultExpression
          } WHERE "${pgColumnName}" IS NULL;`
        );
      }

      sqls.push(`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" SET NOT NULL;`);
      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
        objectId: context.column.id,
      });
    }

    if (columnInfo.data_type !== "USER-DEFINED" || columnInfo.udt_name !== enumTypeName) {
      result.errors.push({
        message: `Type of your enum column is not correct. Expected: 'USER-DEFINED' -> '${enumTypeName}'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id,
        },
        objectId: context.column.id,
      });
    }

    return result;
  },
  cleanUp: async (
    context: IColumnExtensionDeleteContext,
    columnInfo: IColumnInfo,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };

    if (columnInfo.data_type === "USER-DEFINED" && columnInfo.udt_name != null) {
      result.commands.push({
        sqls: [`DROP TYPE ${getPgSelector(columnInfo.udt_name)};`],
        operationSortPosition: OPERATION_SORT_POSITION.DROP_TABLE + 100,
      });
    }
    return result;
  },
};
