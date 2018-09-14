// fullstack-one core
import { Service, Inject, Container } from '@fullstack-one/di';
// DI imports
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { Config, IEnvironment } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';
import { DbSchemaBuilder } from './db-schema-builder';
import { helper } from '@fullstack-one/helper';

export { IDbMeta, IDbRelation };

import * as utils from './gql-schema-builder/utils';
export { utils };

import { createGrants } from './createGrants';

// import sub modules
import { graphQl as gQLHelper } from './helper';

import { parsePermissions } from './gql-schema-builder/parsePermissions';

// import interfaces
import { IDbMeta, IDbRelation } from './db-schema-builder/IDbMeta';
import { parseGQlAstToDbMeta } from './db-schema-builder/fromGQl/gQlAstToDbMeta';
import { PgToDbMeta } from './db-schema-builder/fromPg/pgToDbMeta';

import {
  print,
} from 'graphql';

// export for extensions
// helper: splitActionFromNode
export { splitActionFromNode } from './db-schema-builder/helper';
// create constraint
export { createConstraint } from './db-schema-builder/fromGQl/gQlAstToDbMetaHelper';
// GQL parser
export { registerDirectiveParser } from './db-schema-builder/fromGQl/gQlAstToDbMeta';
// PG Query parser
export { registerQueryParser } from './db-schema-builder/fromPg/pgToDbMeta';
// PG parser
export { registerTriggerParser } from './db-schema-builder/fromPg/pgToDbMeta';
// migrations
export { registerColumnMigrationExtension, registerTableMigrationExtension } from './db-schema-builder/toPg/createSqlObjFromMigrationObject';
@Service()
export class SchemaBuilder {

  private schemaBuilderConfig: any;
  private gQlSdl: any;
  private gqlSdlExtensions: any = [];
  private gQlAst: any;
  private permissions: any;
  private expressions: any;
  private gqlRuntimeDocument: any;
  private resolverMeta: any;
  private dbSchemaBuilder: DbSchemaBuilder;
  private pgToDbMeta: PgToDbMeta;
  private dbMeta: any;
  private extensions: any = [];

  // DI
  private config: Config;
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;

  constructor (
    @Inject(type => Config) config,
    @Inject(type => LoggerFactory) loggerFactory,
    @Inject(type => BootLoader) bootLoader,
    @Inject(type => DbSchemaBuilder) dbSchemaBuilder,
    @Inject(type => PgToDbMeta) pgToDbMeta
    ) {
    this.loggerFactory = loggerFactory;
    this.dbSchemaBuilder = dbSchemaBuilder;
    this.pgToDbMeta = pgToDbMeta;
    this.config = config;

    // register package config
    this.config.registerConfig('SchemaBuilder', __dirname + '/../config');

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.schemaBuilderConfig = this.config.getConfig('SchemaBuilder');
    this.ENVIRONMENT = this.config.ENVIRONMENT;

    bootLoader.addBootFunction(this.boot.bind(this));

    this.getDbSchemaBuilder().addMigrationPath(__dirname + '/..');
  }

  private async boot(): Promise<any> {

    try {

      // load schema
      const gQlSdlPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.schemaPattern;
      this.gQlSdl = await helper.loadFilesByGlobPattern(gQlSdlPattern);

      // check if any files were loaded
      if (this.gQlSdl.length === 0) {
        this.logger.warn('boot.no.sdl.files.found');
        return;
      }

      // Combine all Schemas to a big one and add extensions from other modules
      const gQlSdlCombined = this.gQlSdl.concat(this.gqlSdlExtensions.slice()).join('\n');
      this.gQlAst = gQLHelper.helper.parseGraphQlSchema(gQlSdlCombined);

      this.dbMeta = parseGQlAstToDbMeta(this.gQlAst);

      // load permissions and expressions and generate views and put them into schemas

      // load permissions
      const permissionsPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.permissionsPattern;
      const permissionsArray = await helper.requireFilesByGlobPattern(permissionsPattern);
      this.permissions = [].concat.apply([], permissionsArray);

      // load expressions
      const expressionsPattern = this.ENVIRONMENT.path + this.schemaBuilderConfig.expressionsPattern;
      const expressionsArray = await helper.requireFilesByGlobPattern(expressionsPattern);
      this.expressions = [].concat.apply([], expressionsArray);

      const dbConfig = this.config.getConfig('Db');

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

      const data = parsePermissions(this.permissions, context, extensions, config);

      data.sql.forEach(statement => sql.push(statement));

      data.gqlDocument.definitions.reverse();
      // tslint:disable-next-line:forin
      for (const i in sql) {
        // tslint:disable-next-line:no-console
        console.log(sql[i]);
      }

      this.resolverMeta = data.meta;
      this.gqlRuntimeDocument = data.gqlDocument;
      this.dbSchemaBuilder.setPermissionSqlStatements(sql);

      return this.dbMeta;

    } catch (err) {
      this.logger.warn('boot.error', err);
      throw err;
    }

  }

  public getDbSchemaBuilder() {
    return this.dbSchemaBuilder;
  }

  public async getPgDbMeta(): Promise<IDbMeta> {
    return await this.pgToDbMeta.getPgDbMeta();
  }

  public addExtension(extension) {
    this.extensions.push(extension);
  }

  public getDbMeta() {
    return this.dbMeta;
  }

  public extendSchema(schema: string) {
    this.gqlSdlExtensions.push(schema);
  }

  public getGQlRuntimeObject() {
    return {
      dbMeta: this.dbMeta,
      gqlRuntimeDocument: this.gqlRuntimeDocument,
      resolverMeta: this.resolverMeta
    };
  }

  public getGQlSdl() {
    // return copy instead of ref
    return { ... this.gQlSdl };
  }

  public getGQlAst() {
    // return copy instead of ref
    return { ... this.gQlAst };
  }

  public print(document) {
    return print(document);
  }

}
