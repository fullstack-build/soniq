import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData
} from "../IColumnExtension";
import { IDbTable, IDbColumn, IDbSchema, IDbMutation, IDbMutationColumn } from "../../DbSchemaInterface";
import * as uuidValidate from "uuid-validate";
import { getPgRegClass, findTableById, findColumnByType, getPgSelector, ONE_PREFIX } from "../../helpers";
import { getDefaultAndNotNullChange } from "../generic/factory";
import { getEnum } from "./queryHelper";
import { PoolClient, OPERATION_SORT_POSITION, asyncForEach } from "@fullstack-one/core";
// tslint:disable-next-line:no-submodule-imports
import * as uuidv4 from "uuid/v4";
import { ICompiledExpression } from "../../ExpressionCompiler";

export const ONE_ENUM_PREFIX = `${ONE_PREFIX}ENUM_`;

const getPgColumnName = (context: IColumnExtensionContext): string => {
  return context.column.name;
};

export const columnExtensionEnum: IColumnExtension = {
  type: "enum",
  validateProperties: (context: IColumnExtensionContext) => {
    const result: IPropertieValidationResult = {
      errors: [],
      warnings: []
    };

    if (context.column.properties == null) {
      result.errors.push({
        message: `Properties are required for enum column '${context.table.schema}.${context.table.name}.${context.column.name}'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
      return result;
    }
    const properties = context.column.properties;

    Object.keys(properties).forEach((key) => {
      if (["values", "nullable", "defaultExpression"].indexOf(key) < 0) {
        result.errors.push({
          message: `Unknown property '${key}' on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'enum'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    });
    if (properties.nullable != null) {
      if (properties.nullable !== true && properties.nullable !== false) {
        result.errors.push({
          message: `The property 'nullable' must be boolean on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'enum'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }
    if (properties.defaultExpression != null) {
      if (typeof properties.defaultExpression !== "string") {
        result.errors.push({
          message: `The property 'defaultExpression' must be a string on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'enum'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }
    if (properties.values == null || Array.isArray(properties.values) !== true) {
      result.errors.push({
        message: `The property 'values' must be an array of unique strings on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'enum'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    }
    const allValues: string[] = [];
    for (const i in properties.values) {
      if (properties.values.hasOwnProperty(i)) {
        const value = properties.values[i];
        if (typeof value !== "string") {
          result.errors.push({
            message: `The property 'values' must be an array of unique strings on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'enum'. See value-index '${i}'.`,
            meta: {
              tableId: context.table.id,
              columnId: context.column.id
            }
          });
        } else {
          if (allValues.indexOf(value) >= 0) {
            result.errors.push({
              message: `The property 'values' must be an array of unique strings on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'enum'. Dupblicate value '${value}'.`,
              meta: {
                tableId: context.table.id,
                columnId: context.column.id
              }
            });
          } else {
            allValues.push(value);
          }
        }
      }
    }

    return result;
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName,
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (appliedExpressionId) => ICompiledExpression
  ): IQueryFieldData => {
    return {
      field: `${getPgColumnName(context)}: Enum_${context.table.name}_${context.column.name}`,
      fieldName: getPgColumnName(context),
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
      viewColumnName: getPgColumnName(context),
      canBeFilteredAndOrdered: true,
      queryFieldMeta: {},
      gqlTypeDefs: `\nenum Enum_${context.table.name}_${context.column.name} { \n${context.column.properties.values
        .map((value: string) => value)
        .join(" \n")}\n }\n`
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
      fieldType: `Enum_${context.table.name}_${context.column.name}${isRequired === true ? "!" : ""}`
    };
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    const enumTypeName = `${ONE_ENUM_PREFIX}${context.column.id}_${context.table.schema}`;
    let sql = `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN ${getPgSelector(getPgColumnName(context))} ${getPgSelector(enumTypeName)}`;

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
            sql
          ],
          operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN
        }
      ]
    };
  },
  update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const enumTypeName = `${ONE_ENUM_PREFIX}${context.column.id}_${context.table.schema}`;
    const { table, column } = context;
    const pgColumnName = getPgColumnName(context);
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };
    const currentlyNullable = columnInfo.is_nullable.toUpperCase() === "YES";
    const currentDefaultExpression = columnInfo.column_default;

    const enumValues = await getEnum(dbClient, enumTypeName);

    let hasEnumChanged: any = false;

    const removedValues = [];

    enumValues.forEach((value) => {
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

    await asyncForEach(removedValues, async (value: string) => {
      const { rows } = await dbClient.query(
        `SELECT EXISTS(SELECT ${getPgSelector(getPgColumnName(context))} FROM ${getPgRegClass(context.table)} WHERE ${getPgRegClass(
          context.table
        )}.${getPgSelector(getPgColumnName(context))} = $1 LIMIT 1) "exists";`,
        [value]
      );
      if (rows.length > 0 && rows[0].exists === true) {
        result.errors.push({
          message: `You cannot drop value '${value}' of enum column '${context.column.name}' in table ${getPgRegClass(
            context.table
          )} because there are rows with this value.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    });

    if ((column.properties == null || column.properties.defaultExpression == null) && currentDefaultExpression != null) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" DROP DEFAUlT;`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }
    if (hasEnumChanged === true) {
      const sqls: string[] = [];
      const tempEnumTypeName = `${ONE_ENUM_PREFIX}TEMP_${uuidv4()}`;

      sqls.push(`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN ${getPgSelector(getPgColumnName(context))} DROP DEFAUlT;`);
      sqls.push(`ALTER TYPE ${getPgSelector(enumTypeName)} RENAME TO ${getPgSelector(tempEnumTypeName)};`);
      sqls.push(
        `CREATE TYPE ${getPgSelector(enumTypeName)} AS ENUM (${context.column.properties.values
          .map((value: string) => {
            return `'${value}'`;
          })
          .join(", ")});`
      );
      sqls.push(`ALTER TABLE ${getPgRegClass(context.table)} ALTER COLUMN ${getPgSelector(getPgColumnName(context))} TYPE text;`);
      sqls.push(
        `ALTER TABLE ${getPgRegClass(context.table)} ALTER COLUMN ${getPgSelector(getPgColumnName(context))} TYPE ${getPgSelector(
          enumTypeName
        )} USING ${getPgSelector(getPgColumnName(context))}::${getPgSelector(enumTypeName)};`
      );
      sqls.push(`DROP TYPE ${getPgSelector(tempEnumTypeName)};`);

      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }
    if (
      column.properties != null &&
      column.properties.defaultExpression != null &&
      (currentDefaultExpression !== column.properties.defaultExpression || hasEnumChanged === true)
    ) {
      result.commands.push({
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" SET DEFAULT ${column.properties.defaultExpression};`],
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
        sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" DROP NOT NULL;`],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }
    if (currentlyNullable === true && (column.properties == null || column.properties.nullable !== true)) {
      const sqls = [];
      if (column.properties != null && column.properties.defaultExpression != null) {
        sqls.push(`UPDATE ${getPgRegClass(table)} SET "${pgColumnName}" = ${column.properties.defaultExpression} WHERE "${pgColumnName}" IS NULL;`);
      }

      sqls.push(`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" SET NOT NULL;`);
      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }

    if (columnInfo.data_type !== "USER-DEFINED" || columnInfo.udt_name !== enumTypeName) {
      result.errors.push({
        message: `Type of your enum column is not correct. Expected: 'USER-DEFINED' -> '${enumTypeName}'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    }

    return result;
  },
  cleanUp: async (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    if (columnInfo.data_type === "USER-DEFINED" && columnInfo.udt_name != null) {
      result.commands.push({
        sqls: [`DROP TYPE ${getPgSelector(columnInfo.udt_name)};`],
        operationSortPosition: OPERATION_SORT_POSITION.DROP_TABLE + 100
      });
    }
    return result;
  }
};
