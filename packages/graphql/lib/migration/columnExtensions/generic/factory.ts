import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import { IColumnExtension, IColumnExtensionContext, IPropertieValidationResult, IQueryFieldData, IMutationFieldData } from "../IColumnExtension";
import { IDbTable, IDbColumn, IDbMutation, IDbMutationColumn } from "../../DbSchemaInterface";
import { getPgRegClass, getPgSelector } from "../../helpers";
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

export function createGenericColumnExtension(
  fixedGenericTypes: IFixedGenericTypes,
  migrateTypes: (context: IColumnExtensionContext, columnInfo: IColumnInfo) => string[]
): IColumnExtension {
  const getPgColumnName = (context: IColumnExtensionContext) => {
    return context.column.name;
  };

  return {
    type: fixedGenericTypes.type,
    getPropertiesDefinition: () => {
      return {
        "definitions": {},
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "http://example.com/root.json",
        "type": "object",
        "title": "Generic Column Properties",
        "required": [],
        "properties": {
          "nullable": {
            "$id": "#/properties/nullable",
            "type": "boolean",
            "title": "Is column nullable or not",
            "default": true,
            "examples": [
              true
            ]
          },
          "defaultExpression": {
            "$id": "#/properties/defaultExpression",
            "type": "string",
            "title": "The default value of the column as pg expression",
            "default": null,
            "examples": [
              "'foobar'::text"
            ],
            "pattern": "^(.*)$"
          },
          "moveSelectToQuery": {
            "$id": "#/properties/moveSelectToQuery",
            "type": "boolean",
            "title": "Select the column in QueryBuilder not in view",
            "default": false,
            "examples": [
              true,
              false
            ]
          },
        },
        "additionalProperties": false
      }
    },
    // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
    getPgColumnName,
    getQueryFieldData: (
      context: IColumnExtensionContext,
      localTableAlias: string,
      getCompiledExpressionById: (appliedExpressionId: string, addToList: boolean) => ICompiledExpression,
      getDirectCompiledExpressionById: (appliedExpressionId: string) => ICompiledExpression
    ): IQueryFieldData => {
      const queryFieldData: IQueryFieldData = {
        field: `${getPgColumnName(context)}: ${fixedGenericTypes.gqlType}`,
        fieldName: getPgColumnName(context),
        pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
        pgRootSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
        viewColumnName: getPgColumnName(context),
        columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
        canBeFilteredAndOrdered: true,
        queryFieldMeta: {}
      };

      if (context.column.properties != null && context.column.properties.moveSelectToQuery === true) {
        queryFieldData.pgSelectExpression = `TRUE`;
        queryFieldData.pgRootSelectExpression = `TRUE`;
        queryFieldData.columnSelectExpressionTemplate = `CASE WHEN "{_local_table_}".${getPgSelector(context.column.name)} IS TRUE THEN (SELECT _temp_.${getPgSelector(getPgColumnName(context))} FROM ${getPgRegClass(context.table)} _temp_ WHERE _temp_.id = "{_local_table_}".id) ELSE NULL::text END`;
      }

      return queryFieldData;
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
        fieldType: `${fixedGenericTypes.gqlInputType}${isRequired === true ? "!" : ""}`
      };
    },
    create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
      let sql = `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN "${getPgColumnName(context)}" ${fixedGenericTypes.pgDataType}`;

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
        commands: [{ sqls: [sql], operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN + (context.columnIndex != null ? context.columnIndex / 100 : 0) }]
      };
    },
    update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo): Promise<IGqlMigrationResult> => {
      const sqls = [];

      const result = getDefaultAndNotNullChange(context.table, context.column, columnInfo, getPgColumnName(context));

      migrateTypes(context, columnInfo).forEach((sql) => {
        sqls.push(sql);
      });

      if (sqls.length > 0) {
        result.commands.push({ sqls, operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN });
      }
      return result;
    }
  };
}

export const getDefaultAndNotNullChange = (
  table: IDbTable,
  column: IDbColumn,
  columnInfo: IColumnInfo,
  pgColumnName: string
): IGqlMigrationResult => {
  const result: IGqlMigrationResult = {
    errors: [],
    warnings: [],
    commands: []
  };
  const currentlyNullable = columnInfo.is_nullable.toUpperCase() === "YES";
  const currentDefaultExpression = columnInfo.column_default;

  if ((column.properties == null || column.properties.defaultExpression == null) && currentDefaultExpression != null) {
    result.commands.push({
      sqls: [`ALTER TABLE ${getPgRegClass(table)} ALTER COLUMN "${pgColumnName}" DROP DEFAUlT;`],
      operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
    });
  }
  if (column.properties != null && column.properties.defaultExpression != null && currentDefaultExpression !== column.properties.defaultExpression) {
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

  return result;
};
