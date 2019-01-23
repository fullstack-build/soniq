// fullstack-one core
import { Service, Inject, Container } from "@fullstack-one/di";
// DI imports
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { DbSchemaBuilder } from "./db-schema-builder";
import { AHelper } from "@fullstack-one/helper";

export { IDbMeta, IDbRelation };

import * as utils from "./gql-schema-builder/utils";
export { utils };

import { createGrants } from "./createGrants";

// import sub modules
import { AGraphQlHelper } from "./helper";

import { parsePermissions } from "./gql-schema-builder/parsePermissions";

// import interfaces
import { IDbMeta, IDbRelation } from "./db-schema-builder/IDbMeta";
import { parseGQlAstToDbMeta } from "./db-schema-builder/fromGQl/gQlAstToDbMeta";
import { PgToDbMeta } from "./db-schema-builder/fromPg/pgToDbMeta";

import { print, DocumentNode } from "graphql";

// export for extensions
// helper: splitActionFromNode
export { splitActionFromNode } from "./db-schema-builder/helper";
// create constraint
export { createConstraint } from "./db-schema-builder/fromGQl/gQlAstToDbMetaHelper";
// GQL parser
export { registerDirectiveParser } from "./db-schema-builder/fromGQl/gQlAstToDbMeta";
// PG Query parser
export { registerQueryParser } from "./db-schema-builder/fromPg/pgToDbMeta";
// PG parser
export { registerTriggerParser } from "./db-schema-builder/fromPg/pgToDbMeta";
// migrations
export { registerColumnMigrationExtension, registerTableMigrationExtension } from "./db-schema-builder/toPg/createSqlObjFromMigrationObject";

@Service()
export class SchemaBuilder {
  private schemaBuilderConfig: any;
  private gQlSdl: string[];
  private gqlSdlExtensions: any = [];
  private gQlAst: DocumentNode;
  private permissions: any;
  private expressions: any;
  private gqlRuntimeDocument: any;
  private resolverMeta: any;
  private dbSchemaBuilder: DbSchemaBuilder;
  private pgToDbMeta: PgToDbMeta;
  private dbMeta: IDbMeta;
  private extensions: any = [];

  // DI
  private config: Config;
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;

  constructor(
    @Inject((type) => Config) config,
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => DbSchemaBuilder) dbSchemaBuilder,
    @Inject((type) => PgToDbMeta) pgToDbMeta
  ) {
    this.loggerFactory = loggerFactory;
    this.dbSchemaBuilder = dbSchemaBuilder;
    this.pgToDbMeta = pgToDbMeta;
    this.config = config;

    // register package config
    this.schemaBuilderConfig = this.config.registerConfig("SchemaBuilder", `${__dirname}/../config`);

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.ENVIRONMENT = this.config.ENVIRONMENT;

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));

    this.getDbSchemaBuilder().addMigrationPath(`${__dirname}/..`);
  }

  private async boot(): Promise<IDbMeta> {
    try {
      this.logger.trace("boot", "started");
      // load schema
      const gQlSdlPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.schemaPattern;
      this.gQlSdl = await AHelper.loadFilesByGlobPattern(gQlSdlPattern);
      this.logger.trace("boot", "GraphQl schema loaded");

      // check if any files were loaded
      if (this.gQlSdl.length === 0) {
        this.logger.warn("boot.no.sdl.files.found");
        return;
      }

      // Combine all Schemas to a big one and add extensions from other modules
      const gQlSdlCombined = this.gQlSdl.concat(this.gqlSdlExtensions.slice()).join("\n");
      this.gQlAst = AGraphQlHelper.parseGraphQlSchema(gQlSdlCombined);
      this.logger.trace("boot", "GraphQl schema parsed");

      this.dbMeta = parseGQlAstToDbMeta(this.gQlAst);
      this.logger.trace("boot", "GraphQl AST parsed");

      // load permissions and expressions and generate views and put them into schemas

      // load permissions
      const permissionsPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.permissionsPattern;
      const permissionsArray = await AHelper.requireFilesByGlobPattern(permissionsPattern);
      this.logger.trace("boot", "Permissions loaded");
      this.permissions = [].concat.apply([], permissionsArray);

      // load expressions
      const expressionsPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.expressionsPattern;
      const expressionsArray = await AHelper.requireFilesByGlobPattern(expressionsPattern);
      this.logger.trace("boot", "Expressions loaded");
      this.expressions = [].concat.apply([], expressionsArray);

      const dbConfig = this.config.getConfig("Db");
      this.logger.trace("boot", "Config loaded");

      const config = {
        schemaName: dbConfig.viewSchemaName,
        userName: dbConfig.general.user,
        databaseName: dbConfig.general.database
      };

      const context = {
        gqlDocument: this.gQlAst,
        dbMeta: this.dbMeta,
        expressions: this.expressions
      };

      const extensions = this.extensions;

      const sql = createGrants(config, this.dbMeta);
      this.logger.trace("boot", "Grants created");

      const data = parsePermissions(this.permissions, context, extensions, config);
      this.logger.trace("boot", "Permissions parsed");

      data.sql.forEach((statement) => sql.push(statement));

      //  Reverse to get the generated queries/mutations at the beginning
      data.gqlDocument.definitions.reverse();

      this.resolverMeta = data.meta;
      this.gqlRuntimeDocument = data.gqlDocument;
      this.dbSchemaBuilder.setPermissionSqlStatements(sql);
      this.logger.trace("boot", "Permission SQL statements set");

      return this.dbMeta;
    } catch (err) {
      this.logger.warn("boot.error", err);
      throw err;
    }
  }

  public getDbSchemaBuilder(): DbSchemaBuilder {
    return this.dbSchemaBuilder;
  }

  public async getPgDbMeta(): Promise<IDbMeta> {
    return this.pgToDbMeta.getPgDbMeta();
  }

  public addExtension(extension): void {
    this.extensions.push(extension);
  }

  public getDbMeta(): IDbMeta {
    return this.dbMeta;
  }

  public extendSchema(schema: string): void {
    this.gqlSdlExtensions.push(schema);
  }

  public getGQlRuntimeObject(): { dbMeta: IDbMeta, gqlRuntimeDocument: any, resolverMeta: any } {
    return {
      dbMeta: this.dbMeta,
      gqlRuntimeDocument: this.gqlRuntimeDocument,
      resolverMeta: this.resolverMeta
    };
  }

  public print(document: any): string {
    return print(document);
  }
}
