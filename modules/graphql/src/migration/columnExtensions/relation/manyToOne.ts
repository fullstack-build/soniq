import { IColumnInfo, IGqlMigrationResult } from "../../interfaces";
import {
  IColumnExtension,
  IColumnExtensionContext,
  IColumnExtensionDeleteContext,
  IPropertieValidationResult,
  IQueryFieldData,
  IMutationFieldData,
} from "../IColumnExtension";
import { IDbMutationColumn, IDbMutation, IDbTable } from "../../DbSchemaInterface";
import * as uuidValidate from "uuid-validate";
import { getPgRegClass, findTableById, findColumnByType, getPgSelector } from "../../helpers";
import { getDefaultAndNotNullChange } from "../generic/factory";
import { getRelations, IRelation } from "./queryHelper";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
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

export type TManyToOneColumnActionTypes = "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
export type TManyToOneColumnValidationTypes = "NOT DEFERRABLE" | "INITIALLY DEFERRED" | "DEFERRABLE";

export interface IManyToOneColumnProperties {
  foreignTableId: string;
  nullable?: boolean | null;
  defaultExpression?: string | null;
  onDelete: TManyToOneColumnActionTypes;
  onUpdate: TManyToOneColumnActionTypes;
  validation: TManyToOneColumnValidationTypes;
}

function getPgColumnNameByColumnName(columnName: string): string {
  return `${columnName}Id`;
}

function getPgColumnName(context: IColumnExtensionContext): string {
  return getPgColumnNameByColumnName(context.column.name);
}

const ACTION_TYPES: string[] = ["NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT"];
const VALIDATION_TYPES: string[] = ["NOT DEFERRABLE", "INITIALLY DEFERRED", "DEFERRABLE"];

function hasFkConstraintChanged(context: IColumnExtensionContext, relation: IRelation): boolean {
  const properties: IManyToOneColumnProperties = context.column.properties;
  const foreignTable: IDbTable | null = findTableById(context.schema, properties.foreignTableId);

  if (foreignTable == null) {
    throw new Error(
      `Could not find foreign table with id ${properties.foreignTableId} in column ${context.column.id}.`
    );
  }

  const targetDeleteRule: string = properties.onDelete != null ? properties.onDelete : ACTION_TYPES[0];
  const targetUpdateRule: string = properties.onUpdate != null ? properties.onUpdate : ACTION_TYPES[0];
  const targetIsDeferrable: boolean =
    properties.validation != null && VALIDATION_TYPES.indexOf(properties.validation) > 0;
  const targetInitiallyDeferred: boolean =
    properties.validation != null && properties.validation === VALIDATION_TYPES[1];

  const currentDeleteRule: string = relation.delete_rule;
  const currentUpdateRule: string = relation.update_rule;
  const currentIsDeferrable: boolean = relation.is_deferrable === "YES";
  const currentInitiallyDeferred: boolean = relation.initially_deferred === "YES";

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
}

export function generateConstraint(context: IColumnExtensionContext, relations: IRelation[] | null): string | null {
  const properties: IManyToOneColumnProperties = context.column.properties;
  const foreignTable: IDbTable | null = findTableById(context.schema, properties.foreignTableId);

  if (foreignTable == null) {
    throw new Error(
      `Could not find foreign table with id ${properties.foreignTableId} in column ${context.column.id}.`
    );
  }

  if (relations != null && relations.length === 1) {
    if (hasFkConstraintChanged(context, relations[0]) !== true) {
      return null;
    }
  }

  let sql: string = `ALTER TABLE ${getPgRegClass(context.table)}`;

  if (relations != null) {
    relations.forEach((relation: IRelation) => {
      sql += ` DROP CONSTRAINT "${relation.constraint_name}",`;
    });
  }

  sql += ` ADD CONSTRAINT "ONE_FK_${uuidv4()}" FOREIGN KEY ("${getPgColumnName(context)}") REFERENCES ${getPgRegClass(
    foreignTable
  )}("id")`;

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
}

export const columnExtensionManyToOne: IColumnExtension = {
  type: "manyToOne",
  getPropertiesDefinition: () => {
    return {
      definitions: {},
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://example.com/root.json",
      type: "object",
      title: "ManyToOne Column Properties",
      required: ["foreignTableId"],
      properties: {
        foreignTableId: {
          $id: "#/properties/foreignTableId",
          type: "string",
          title: "FOREIGN_TABLE",
          description: "An foreignTableId another table",
          pattern: "^(.*)$",
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
        onDelete: {
          $id: "#/properties/onDelete",
          type: "string",
          title: "Relation onDelete behaviour",
          default: ACTION_TYPES[0],
          enum: ACTION_TYPES,
        },
        onUpdate: {
          $id: "#/properties/onUpdate",
          type: "string",
          title: "Relation onUpdate behaviour",
          default: ACTION_TYPES[0],
          enum: ACTION_TYPES,
        },
        validation: {
          $id: "#/properties/validation",
          type: "string",
          title: "Relation validation",
          enum: VALIDATION_TYPES,
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
    const properties: IManyToOneColumnProperties = context.column.properties || {};

    if (uuidValidate(properties.foreignTableId) !== true) {
      result.errors.push({
        message: `The property 'foreignTableId' must be an uuid on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
        meta: {
          tableId: context.table.id,
          columnId: context.column.id,
        },
        objectId: context.column.id,
      });
    } else {
      const foreignTable: IDbTable | null = findTableById(context.schema, properties.foreignTableId);
      if (foreignTable == null) {
        result.errors.push({
          message: `Could not find foreignTableId '${properties.foreignTableId}' on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
          meta: {
            tableId: context.table.id,
            columnId: context.column.id,
          },
          objectId: context.column.id,
        });
      } else {
        if (findColumnByType(foreignTable, "id") == null) {
          result.errors.push({
            message: `The table '${foreignTable.schema}.${foreignTable.name}' must have column of type 'id' for relation on '${context.table.schema}.${context.table.name}.${context.column.name}' for type 'manyToOne'.`,
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
  getPgColumnName,
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (expressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (expressionId: string) => ICompiledExpression
  ): IQueryFieldData => {
    const foreignTable: IDbTable | null = findTableById(context.schema, context.column.properties.foreignTableId);

    if (foreignTable == null) {
      throw new Error(
        `Could not find foreign table with id ${context.column.properties.foreignTableId} in column ${context.column.id}.`
      );
    }

    return {
      field: `${context.column.name}: ${foreignTable.name}`,
      fieldName: context.column.name,
      pgSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
      pgRootSelectExpression: `${getPgSelector(localTableAlias)}.${getPgSelector(getPgColumnName(context))}`,
      viewColumnName: getPgColumnName(context),
      columnSelectExpressionTemplate: `"{_local_table_}".${getPgSelector(getPgColumnName(context))}`,
      canBeFilteredAndOrdered: true,
      queryFieldMeta: {
        manyToOne: {
          foreignColumnName: "id",
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
    const isNullable: boolean = context.column.properties != null && context.column.properties.nullable === true;
    const hasDefault: boolean =
      context.column.properties != null && context.column.properties.defaultExpression != null;
    const isRequired: boolean = mutationColumn.isRequired === true || (isNullable !== true && hasDefault !== true);

    return {
      fieldType: `ID${isRequired === true ? "!" : ""}`,
    };
  },
  create: async (context: IColumnExtensionContext): Promise<IGqlMigrationResult> => {
    let sql: string = `ALTER TABLE ${getPgRegClass(context.table)} ADD COLUMN "${getPgColumnName(context)}" uuid`;

    if (context.column.properties == null || context.column.properties.nullable !== true) {
      sql += ` NOT NULL`;
    }

    if (context.column.properties != null && context.column.properties.defaultExpression != null) {
      sql += ` DEFAULT ${context.column.properties.defaultExpression}`;
    }

    sql += ";";

    try {
      const constraintSql: string | null = generateConstraint(context, null);

      if (constraintSql == null) {
        throw new Error("Something is broken. This Error should not be possible.");
      }

      return {
        errors: [],
        warnings: [],
        commands: [
          {
            sqls: [sql, constraintSql],
            operationSortPosition: OPERATION_SORT_POSITION.ADD_COLUMN + 100,
            objectId: context.column.id,
          },
        ],
      };
    } catch (error) {
      return {
        errors: [
          {
            message: `Failed to generateConstraint: ${error.message}`,
            error,
            objectId: context.column.id,
          },
        ],
        warnings: [],
        commands: [],
      };
    }
  },
  update: async (
    context: IColumnExtensionContext,
    columnInfo: IColumnInfo,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = getDefaultAndNotNullChange(
      context.table,
      context.column,
      columnInfo,
      getPgColumnName(context)
    );

    try {
      const relations: IRelation[] = await getRelations(
        dbClient,
        columnInfo.table_schema,
        columnInfo.table_name,
        columnInfo.column_name
      );

      const constraintSql: string | null = generateConstraint(context, relations);
      if (constraintSql != null) {
        result.commands.push({
          sqls: [constraintSql],
          operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
          objectId: context.column.id,
        });
      }
    } catch (error) {
      result.errors.push({
        message: `Failed to getRelations or generateConstraint: ${error.message}`,
        error,
        objectId: context.column.id,
      });
    }

    if (columnInfo.data_type !== "uuid") {
      result.errors.push({ message: "Id column is no uuid.", objectId: context.column.id });
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

    const relations: IRelation[] = await getRelations(
      dbClient,
      columnInfo.table_schema,
      columnInfo.table_name,
      columnInfo.column_name
    );

    if (relations != null && relations.length > 0) {
      result.commands.push({
        sqls: [
          `ALTER TABLE ${getPgRegClass(context.table)} ${relations
            .map((relation: IRelation) => {
              return `DROP CONSTRAINT "${relation.constraint_name}"`;
            })
            .join(", ")};`,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN - 100,
      });
    }
    return result;
  },
};
