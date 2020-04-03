import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import { IColumnExtensionContext, IPropertieValidationResult, IColumnExtension, IQueryFieldData, IMutationFieldData, IColumnExtensionDeleteContext } from "../IColumnExtension";
import { getPgRegClass, getPgSelector } from "../../helpers";
import { ICompiledExpression } from "../../ExpressionCompiler";
import { IDbMutationColumn, IDbMutation } from "../../DbSchemaInterface";
import { OPERATION_SORT_POSITION, PoolClient } from "@fullstack-one/core";
// tslint:disable-next-line:no-submodule-imports
import * as uuidv4 from "uuid/v4";
import { getTriggers } from "./queryHelper";

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
  getPropertiesDefinition: () => {
    return {
      "definitions": {},
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "http://example.com/root.json",
      "type": "object",
      "title": "UpdatedAt Column Properties",
      "additionalProperties": false
    }
  },
  // Get the columnName in DB (e.g. userId instead of user). Overwrite and return null if it is a virtual column
  getPgColumnName: (context: IColumnExtensionContext): string => {
    return context.column.name;
  },
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (appliedExpressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (appliedExpressionId: string) => ICompiledExpression
  ): IQueryFieldData => {
    return {
      field: `${context.column.name}: String`,
      fieldName: context.column.name,
      pgRootSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(context.column.name)}`,
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(context.column.name)}`,
      viewColumnName: context.column.name,
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(context.column.name)}`,
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
    const triggerName = `updatedAt_trigger_${uuidv4()}`;

    const sqls = [
      `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN ${getPgSelector(
        context.column.name
      )} timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL;`,
      `CREATE TRIGGER ${getPgSelector(triggerName)} BEFORE UPDATE ON ${getPgRegClass(context.table)} FOR EACH ROW EXECUTE PROCEDURE _graphql_meta.updated_at_trigger();`
    ];

    return {
      errors: [],
      warnings: [],
      commands: [{ sqls, operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN + (context.columnIndex != null ? context.columnIndex / 100 : 0) }]
    };
  },
  update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    const triggers = await getTriggers(dbClient, columnInfo.table_schema, columnInfo.table_name);

    let updateTrigger = triggers == null || triggers.length < 1;
    if (updateTrigger !== true && triggers.length > 0) {
      if (triggers.length > 1) {
        updateTrigger = true;
      } else {
        const trigger = triggers[0];
        if (trigger.action_orientation !== "ROW") {
          updateTrigger = true;
        }
        if (trigger.action_statement !== "EXECUTE PROCEDURE _graphql_meta.updated_at_trigger()") {
          updateTrigger = true;
        }
        if (trigger.action_timing !== "BEFORE") {
          updateTrigger = true;
        }
        if (trigger.event_manipulation !== "UPDATE") {
          updateTrigger = true;
        }
      }
    }

    if (updateTrigger === true) {
      const sqls = [];

      if (triggers != null) {
        triggers.forEach((trigger) => {
          sqls.push(`DROP TRIGGER ${getPgSelector(trigger.trigger_name)} ON ${getPgRegClass(context.table)};`);
        });
      }
      const triggerName = `updatedAt_trigger_${uuidv4()}`;

      sqls.push(`CREATE TRIGGER ${getPgSelector(triggerName)} BEFORE UPDATE ON ${getPgRegClass(context.table)} FOR EACH ROW EXECUTE PROCEDURE _graphql_meta.updated_at_trigger();`);

      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }

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
  },
  cleanUp: async (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    const triggers = await getTriggers(dbClient, columnInfo.table_schema, columnInfo.table_name);

    if (triggers != null && triggers.length > 0) {
      const sqls = [];
      triggers.forEach((trigger) => {
        sqls.push(`DROP TRIGGER ${getPgSelector(trigger.trigger_name)} ON ${getPgRegClass(context.table)};`);
      });
      result.commands.push({
        sqls,
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN - 100
      });
    }

    return result;
  }
};
