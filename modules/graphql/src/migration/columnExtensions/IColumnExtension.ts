import { IDbTable, IDbSchema, IDbColumn, IDbMutationColumn, IDbMutation } from "../DbSchemaInterface";
import { IGqlMigrationResult, IColumnInfo, ITableMeta, IGqlMigrationContext } from "../interfaces";
import { PoolClient, IMigrationError } from "soniq";
import { IQueryFieldMeta, IResolverMapping } from "../../RuntimeInterfaces";
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
  pgRootSelectExpression: string;
  viewColumnName: string;
  columnSelectExpressionTemplate: string;
  canBeFilteredAndOrdered: boolean;
  queryFieldMeta: IQueryFieldMeta | {};
  resolverMappings?: IResolverMapping[];
  gqlTypeDefs?: string;
}

export interface IMutationFieldData {
  fieldType: string;
}

export interface IRootFieldData {
  fieldType: string;
}

export interface IColumnExtension {
  // Meta and validation
  type: string;
  getPropertiesDefinition: () => boolean | object;
  validateProperties?: (context: IColumnExtensionContext) => IPropertieValidationResult;

  // Database Stuff
  getPgColumnName: (context: IColumnExtensionContext) => string | null;
  getPgExpression?: (context: IColumnExtensionContext, expressionGenerator: ExpressionGenerator) => string;
  create: (
    context: IColumnExtensionContext,
    pgClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<IGqlMigrationResult>;
  update: (
    context: IColumnExtensionContext,
    columnInfo: IColumnInfo,
    pgClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<IGqlMigrationResult>;
  cleanUp?: (
    context: IColumnExtensionDeleteContext,
    columnInfo: IColumnInfo,
    pgClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<IGqlMigrationResult>;

  // Helpers to create gql and ts types
  getQueryFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    getCompiledExpressionById: (expressionId: string, addToList: boolean) => ICompiledExpression,
    getDirectCompiledExpressionById: (expressionId: string) => ICompiledExpression
  ) => IQueryFieldData;
  getMutationFieldData: (
    context: IColumnExtensionContext,
    localTableAlias: string,
    mutation: IDbMutation,
    mutationColumn: IDbMutationColumn
  ) => IMutationFieldData;
}
