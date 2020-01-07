import { IDbTable, IDbSchema, IDbColumn, IDbMutationColumn, IDbMutation } from "../DbSchemaInterface";
import { IGqlMigrationResult, IColumnInfo, ITableMeta } from "../interfaces";
import { PoolClient, IMigrationError } from "@fullstack-one/core";
import { IQueryFieldMeta, IResolver } from "../../RuntimeInterfaces";
import { ExpressionGenerator } from "../ExpressionGenerator";
import { ICompiledExpression } from "../ExpressionCompiler";

export interface IColumnExtensionContext {
  schema: IDbSchema;
  table: IDbTable;
  column: IDbColumn;
  columnIndex?: number;
}

export interface IColumnExtensionDeleteContext {
  schema: IDbSchema;
  table: IDbTable | ITableMeta;
}

export interface IPropertieValidationResult {
  errors: IMigrationError[];
  warnings: IMigrationError[];
}

export interface IQueryFieldData {
  field: string; // e.g. events(where: EventFilter, orderBy: [EventOrderBy!], limit: Int, offset: Int): [Event!]!
  fieldName: string;
  pgSelectExpression: string;
  viewColumnName: string;
  columnSelectExpressionTemplate: string;
  canBeFilteredAndOrdered: boolean;
  queryFieldMeta: IQueryFieldMeta | {};
  resolvers?: IResolver[];
  gqlTypeDefs?: string;
}

export interface IMutationFieldData {
  fieldType: string;
}

export interface IColumnExtension {
  // Meta and validation
  type: string;
  getPropertiesDefinition: () => any;
  validateProperties?: (context: IColumnExtensionContext) => IPropertieValidationResult;

  // Database Stuff
  getPgColumnName: (context: IColumnExtensionContext) => string;
  getPgExpression?: (context: IColumnExtensionContext, expressionGenerator: ExpressionGenerator) => string;
  create: (context: IColumnExtensionContext, pgClient: PoolClient, gqlMigrationContext: any) => Promise<IGqlMigrationResult>;
  update: (context: IColumnExtensionContext, columnInfo: IColumnInfo, pgClient: PoolClient, gqlMigrationContext: any) => Promise<IGqlMigrationResult>;
  cleanUp?: (context: IColumnExtensionDeleteContext, columnInfo: IColumnInfo, pgClient: PoolClient, gqlMigrationContext: any) => Promise<IGqlMigrationResult>;

  // Helpers to create gql and ts types
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (appliedExpressionId: string) => ICompiledExpression
  ) => IQueryFieldData;
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ) => IMutationFieldData;
}
