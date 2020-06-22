// fullstack-one core
import { Service, Inject, Container } from "@fullstack-one/di";
// DI imports
import { LoggerFactory, Logger } from "@fullstack-one/logger";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { IDbConfig, ORM } from "@fullstack-one/db";
import { AHelper } from "@fullstack-one/helper";

import createGraphQLViews from "./createGraphQLViews";

export * from "./db-schema-builder/IDbMeta";
export * from "./gql-schema-builder/interfaces";
export * from "./decorators/index";

import * as utils from "./gql-schema-builder/utils";
export { utils };

// import sub modules
import { AGraphQlHelper } from "./helper";

import { parsePermissions } from "./gql-schema-builder/parsePermissions";

// import interfaces
import { IDbMeta } from "./db-schema-builder/IDbMeta";
import { parseGQlAstToDbMeta } from "./db-schema-builder/fromGQl/gQlAstToDbMeta";

import { print, DocumentNode, DefinitionNode } from "graphql";
import { expressions } from "./gql-schema-builder/expressions/defineExpression";
import { IPermissionContext, IConfig, IResolverMeta, IPermission } from "./gql-schema-builder/interfaces";
import { getDecoratorPermissions, AfterLoadForComputedColumnsSubscriber } from "./decorators";

// export for extensions
export { defineExpression } from "./gql-schema-builder/expressions/defineExpression";
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
  private gqlRuntimeDocument: DocumentNode;
  private resolverMeta: any;
  private dbMeta: IDbMeta;
  private extensions: any = [];

  private config: Config;
  private loggerFactory: LoggerFactory;
  private logger: Logger;
  private ENVIRONMENT: IEnvironment;

  constructor(
    @Inject((type) => Config) config,
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => ORM) private readonly orm: ORM
  ) {
    this.loggerFactory = loggerFactory;
    this.config = config;

    this.schemaBuilderConfig = this.config.registerConfig("SchemaBuilder", `${__dirname}/../config`);

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.ENVIRONMENT = this.config.ENVIRONMENT;

    this.orm.addSubscriber(AfterLoadForComputedColumnsSubscriber);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot(): Promise<IDbMeta> {
    try {
      this.logger.debug("boot", "started");

      this.extendSchema(this.orm.getGraphQlSDL());

      // load schema
      const gQlSdlPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.schemaPattern;
      this.gQlSdl = await AHelper.loadFilesByGlobPattern(gQlSdlPattern);
      this.logger.debug("boot", "GraphQl schema loaded");

      // check if any files were loaded
      if (this.gQlSdl.length === 0) {
        this.logger.warn("boot.no.sdl.files.found");
        return;
      }

      // Combine all Schemas to a big one and add extensions from other modules
      const gQlSdlCombined = this.gQlSdl.concat(this.gqlSdlExtensions.slice()).join("\n");
      this.gQlAst = AGraphQlHelper.parseGraphQlSchema(gQlSdlCombined);
      this.logger.debug("boot", "GraphQl schema parsed");

      this.dbMeta = parseGQlAstToDbMeta(this.gQlAst);
      this.logger.debug("boot", "GraphQl AST parsed");

      const permissions = await this.loadPermissions();

      const dbConfig: IDbConfig = this.config.getConfig("Db");
      this.logger.debug("boot", "Config loaded");

      const config: IConfig = {
        schemaName: "_graphql",
        userName: dbConfig.username,
        databaseName: dbConfig.database
      };

      const context: IPermissionContext = {
        gqlDocument: this.gQlAst,
        dbMeta: this.dbMeta,
        expressions
      };

      const extensions = this.extensions;

      const data = parsePermissions(permissions, context, extensions, config);
      this.logger.debug("boot", "Permissions parsed");

      //  Reverse to get the generated queries/mutations at the beginning
      (data.gqlDocument.definitions as DefinitionNode[]).reverse();

      this.resolverMeta = data.meta;
      this.gqlRuntimeDocument = data.gqlDocument;
      this.logger.debug("boot", "Permission SQL statements set");

      if (this.schemaBuilderConfig.createGraphQlViews === true) {
        this.logger.debug("boot", "Create GraphQL views start");
        await createGraphQLViews(this.orm, this.logger, data.sql);
        this.logger.debug("boot", "Create GraphQL views end");
      }

      return this.dbMeta;
    } catch (err) {
      this.logger.warn("boot.error", err);
      throw err;
    }
  }

  private async loadPermissions(): Promise<IPermission[]> {
    const permissionsPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.permissionsPattern;
    const permissionsArray: IPermission[] = await AHelper.requireFilesByGlobPattern(permissionsPattern);
    this.logger.debug("boot", "Permissions loaded");
    const decoratorPermissions = getDecoratorPermissions();
    return [].concat.apply([], permissionsArray).concat(decoratorPermissions);
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

  public getGQlRuntimeObject(): { dbMeta: IDbMeta; gqlRuntimeDocument: DocumentNode; resolverMeta: IResolverMeta } {
    return {
      dbMeta: this.dbMeta,
      gqlRuntimeDocument: this.gqlRuntimeDocument,
      resolverMeta: this.resolverMeta
    };
  }

  public getGQlSdl() {
    // return copy instead of ref
    return { ...this.gQlSdl };
  }

  public getGQlAst() {
    // return copy instead of ref
    return { ...this.gQlAst };
  }

  public print(document: any): string {
    return print(document);
  }
}
