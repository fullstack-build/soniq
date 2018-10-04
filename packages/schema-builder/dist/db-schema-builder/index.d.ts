import { Config } from "@fullstack-one/config";
import { LoggerFactory } from "@fullstack-one/logger";
import { DbAppClient } from "@fullstack-one/db";
import { IDbMeta } from "./IDbMeta";
export declare class DbSchemaBuilder {
  private fromDbMeta;
  private toDbMeta;
  private migrationObject;
  private dbAppClient;
  private initSqlPaths;
  private dbConfig;
  private schemaBuilderConfig;
  private permissionSqlStatements;
  private readonly config;
  private readonly logger;
  constructor(bootLoader: any, config: Config, loggerFactory: LoggerFactory, dbAppClient: DbAppClient);
  private boot;
  addMigrationPath(path: string): void;
  getMigrationDbMeta(): IDbMeta;
  setPermissionSqlStatements(permissionSqlStatements: any): void;
  initDb(): Promise<void>;
  getMigrationSqlStatements(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop?: boolean): string[];
  getViewsSql(): any;
  getBootSql(): any[];
  migrate(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop?: boolean): Promise<void>;
}
