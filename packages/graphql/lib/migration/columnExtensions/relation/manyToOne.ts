import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData
} from "../IColumnExtension";
import { IDbTable, IDbColumn, IDbSchema, IDbMutationColumn, IDbMutation } from "../../DbSchemaInterface";
import * as uuidValidate from "uuid-validate";
import { getPgRegClass, findTableById, findColumnByType, getPgSelector } from "../../helpers";
import { getDefaultAndNotNullChange } from "../generic/factory";
import { getRelations, IRelation } from "./queryHelper";
import { PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
// tslint:disable-next-line:no-submodule-imports
import * as uuidv4 from "uuid/v4";
import { ICompiledExpression } from "../../ExpressionCompiler";

export interface IFixedGenericTypes {
  type: string;
  pgDataType: string;
  gqlType: string;
  gqlInputType: string;
  tsType: string;
  tsInputType: string;
}

const getPgColumnNameByColumnName = (columnName: string): string => {
  return `${columnName}Id`;
};

const getPgColumnName = (context: IColumnExtensionContext): string => {
  return getPgColumnNameByColumnName(context.column.name);
};

const ACTION_TYPES = ["NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT"];
const VALIDATION_TYPES = ["NOT DEFERRABLE", "INITIALLY DEFERRED", "DEFERRABLE"];

const hasFkConstraintChanged = (context: IColumnExtensionContext, relation: IRelation) => {
  const properties = context.column.properties;
  const foreignTable = findTableById(context.schema, properties.foreignTableId);

  const targetDeleteRule = properties.onDelete != null ? properties.onDelete : ACTION_TYPES[0];
  const targetUpdateRule = properties.onUpdate != null ? properties.onUpdate : ACTION_TYPES[0];
  const targetIsDeferrable = properties.validation != null && VALIDATION_TYPES.indexOf(properties.validation) > 0;
  const targetInitiallyDeferred = properties.validation != null && properties.validation === VALIDATION_TYPES[1];

  const currentDeleteRule = relation.delete_rule;
  const currentUpdateRule = relation.update_rule;
  const currentIsDeferrable = relation.is_deferrable === "YES";
  const currentInitiallyDeferred = relation.initially_deferred === "YES";

  if (
    targetDeleteRule !== currentDeleteRule ||
    targetUpdateRule !== currentUpdateRule ||
    targetIsDeferrable !== currentIsDeferrable ||
    targetInitiallyDeferred !== currentInitiallyDeferred
  ) {
    return true;
  }

  if (
    foreignTable.name !== relation.foreign_table_name ||
    foreignTable.schema !== relation.foreign_table_schema ||
    relation.foreign_column_name !== "id"
  ) {
    return true;
  }
  return false;
};

export const generateConstraint = (context: IColumnExtensionContext, relations: IRelation[] | null): string | null => {
  const properties = context.column.properties;
  const foreignTable = findTableById(context.schema, properties.foreignTableId);

  if (relations != null && relations.length === 1) {
    if (hasFkConstraintChanged(context, relations[0]) !== true) {
      return null;
    }
  }

  let sql = `ALTER TABLE ${getPgRegClass(context.table)}`;

  if (relations != null) {
    relations.forEach((relation) => {
      sql += ` DROP CONSTRAINT "${relation.constraint_name}",`;
    });
  }

  sql += ` ADD CONSTRAINT "ONE_FK_${uuidv4()}" FOREIGN KEY ("${getPgColumnName(context)}") REFERENCES ${getPgRegClass(foreignTable)}("id")`;

  if (properties.onDelete != null) {
    switch (properties.onDelete) {
      case "NO ACTION":
        break;
      case "RESTRICT":
        sql += " ON DELETE RESTRICT";
        break;
      case "CASCADE":
        sql += " ON DELETE CASCADE";
        break;
      case "SET NULL":
        sql += " ON DELETE SET NULL";
        break;
      case "SET DEFAULT":
        sql += " ON DELETE SET DEFAULT";
        break;
      default:
        throw new Error(
          `Invalid onDelete action type '${properties.onDelete}' in manyToOne type. Not catched by validator. TableId: ${context.table.id} ColumnId: ${context.column.id}`
        );
    }
  }

  if (properties.onUpdate != null) {
    switch (properties.onUpdate) {
      case "NO ACTION":
        break;
      case "RESTRICT":
        sql += " ON UPDATE RESTRICT";
        break;
      case "CASCADE":
        sql += " ON UPDATE CASCADE";
        break;
      case "SET NULL":
        sql += " ON UPDATE SET NULL";
        break;
      case "SET DEFAULT":
        sql += " ON UPDATE SET DEFAULT";
        break;
      default:
        throw new Error(
          `Invalid onUpdate action type '${properties.onUpdate}' in manyToOne type. Not catched by validator. TableId: ${context.table.id} ColumnId: ${context.column.id}`
        );
    }
  }

  if (properties.validation != null) {
    switch (properties.validation) {
      case "NOT DEFERRABLE":
        break;
      case "INITIALLY DEFERRED":
        sql += " DEFERRABLE INITIALLY DEFERRED";
        break;
      case "DEFERRABLE":
        sql += " DEFERRABLE";
        break;
      default:
        throw new Error(
          `Invalid validation action type '${properties.validation}' in manyToOne type. Not catched by validator. TableId: ${context.table.id} ColumnId: ${context.column.id}`
        );
    }
  }

  sql += ";";

  return sql;
};

export const columnExtensionManyToOne: IColumnExtension = {
  type: "manyToOne",
  validateProperties: (context: IColumnExtensionContext) => {
    const result: IPropertieValidationResult = {
      errors: [],
      warnings: []
    };

    if (context.column.properties == null) {
      result.errors.push({
        message: `Properties are required for manyToOne column '${context.table.schema}.${context.table.name}.${context.column.name}'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
      return result;
    }
    const properties = context.column.properties;

    Object.keys(properties).forEach((key) => {
      if (["foreignTableId", "nullable", "defaultExpression", "onDelete", "onUpdate", "validation"].indexOf(key) < 0) {
        result.errors.push({
          message: `Unknown property '${key}' on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
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
          message: `The property 'nullable' must be boolean on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
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
          message: `The property 'defaultExpression' must be a string on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }
    if (properties.onDelete != null) {
      if (typeof properties.onDelete !== "string" || ACTION_TYPES.indexOf(properties.onDelete) < 0) {
        result.errors.push({
          message: `The property 'onDelete' must be a string out of '${ACTION_TYPES.join(", ")}' on '${context.table.schema}.${context.table.name}.${
            context.column.name
          }' for type 'manyToOne'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }
    if (properties.onUpdate != null) {
      if (typeof properties.onUpdate !== "string" || ACTION_TYPES.indexOf(properties.onUpdate) < 0) {
        result.errors.push({
          message: `The property 'onUpdate' must be a string out of '${ACTION_TYPES.join(", ")}' on '${context.table.schema}.${context.table.name}.${
            context.column.name
          }' for type 'manyToOne'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }
    if (properties.validation != null) {
      if (typeof properties.validation !== "string" || VALIDATION_TYPES.indexOf(properties.validation) < 0) {
        result.errors.push({
          message: `The property 'validation' must be a string out of '${VALIDATION_TYPES.join(", ")}' on '${context.table.schema}.${
            context.table.name
          }.${context.column.name}' for type 'manyToOne'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      }
    }
    if (properties.foreignTableId == null || uuidValidate(properties.foreignTableId) !== true) {
      result.errors.push({
        message: `The property 'foreignTableId' must be an uuid on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id
        }
      });
    } else {
      const foreignTable = findTableById(context.schema, properties.foreignTableId);
      if (foreignTable == null) {
        result.errors.push({
          message: `Could not find foreignTableId '${properties.foreignTableId}' on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id
          }
        });
      } else {
        if (findColumnByType(foreignTable, "id") == null) {
          result.errors.push({
            message: `The table '${foreignTable.schema}.${foreignTable.name}' must have column of type 'id' for relation on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
            meta: {
              tableId: context.table.id,
              columnId: context.column.id
            }
          });
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
    const foreignTable = findTableById(context.schema, context.column.properties.foreignTableId);

    return {
      field: `${context.column.name}: ${foreignTable.name}`,
      fieldName: context.column.name,
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
      viewColumnName: getPgColumnName(context),
      canBeFilteredAndOrdered: true,
      queryFieldMeta: {
        manyToOne: {
          foreignColumnName: "id"
        }
      }
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
      fieldType: `ID${isRequired === true ? "!" : ""}`
    };
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    let sql = `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN "${getPgColumnName(context)}" uuid`;

    if (context.column.properties == null || context.column.properties.nullable !== true) {
      sql += ` NOT NULL`;
    }

    if (context.column.properties != null && context.column.properties.defaultExpression != null) {
      sql += ` DEFAULT ${context.column.properties.defaultExpression}`;
    }

    sql += ";";

    const constraintSql = generateConstraint(context, null);

    return {
      errors: [],
      warnings: [],
      commands: [
        {
          sqls: [sql, constraintSql],
          operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN + 100
        }
      ]
    };
  },
  update: async (context: IColumnExtensionContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result = getDefaultAndNotNullChange(context.table, context.column, columnInfo, getPgColumnName(context));

    const relations = await getRelations(dbClient, columnInfo.table_schema, columnInfo.table_name, columnInfo.column_name);

    const constraintSql = generateConstraint(context, relations);
    if (constraintSql != null) {
      result.commands.push({
        sqls: [constraintSql],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN
      });
    }

    if (columnInfo.data_type !== "uuid") {
      result.errors.push({ message: "Id column is no uuid." });
    }

    return result;
  },
  cleanUp: async (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    const relations = await getRelations(dbClient, columnInfo.table_schema, columnInfo.table_name, columnInfo.column_name);

    if (relations != null && relations.length > 0) {
      result.commands.push({
        sqls: [
          `ALTER TABLE ${getPgRegClass(context.table)} ${relations
            .map((relation) => {
              return `DROP CONSTRAINT "${relation.constraint_name}"`;
            })
            .join(", ")};`
        ],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN - 100
      });
    }
    return result;
  }
};
