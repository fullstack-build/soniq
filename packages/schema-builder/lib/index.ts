// fullstack-one core
import { Service, Inject, Container } from '@fullstack-one/di';
// DI imports
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { Config, IEnvironment } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';
import { DbSchemaBuilder, registerDirectiveParser } from './db-schema-builder';
import { helper } from '@fullstack-one/helper';

export { IViews, IExpressions, IDbMeta, IDbRelation };

import * as utils from './gql-schema-builder/utils';
export { utils };

// import sub modules
import { graphQl as gQLHelper } from './helper';

import { gqlSchemaBuilder } from './gql-schema-builder';

// import interfaces
import { IViews, IExpressions } from './gql-schema-builder/interfaces';
import { IDbMeta, IDbRelation } from './db-schema-builder/IDbMeta';
import { parseGQlAstToDbMeta } from './db-schema-builder/graphql/gQlAstToDbMeta';
import { PgToDbMeta } from './db-schema-builder/pg/pgToDbMeta';

@Service()
export class SchemaBuilder {

  private graphQlConfig: any;
  private gQlSdl: any;
  private gQlSdlExtensions: any = [];
  private gQlAst: any;
  private views: IViews;
  private expressions: IExpressions;
  private gQlRuntimeDocument: any;
  private dbSchemaBuilder: DbSchemaBuilder;
  private pgToDbMeta: PgToDbMeta;
  private gQlRuntimeSchema: string;
  private gQlTypes: any;
  private dbMeta: any;
  private mutations: any;
  private queries: any;
  private customOperations: any;
  private parsers: any = [];

  // DI
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;

  constructor (
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(type => Config) config?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => DbSchemaBuilder) dbSchemaBuilder?,
    @Inject(type => PgToDbMeta) pgToDbMeta?
    ) {
    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.dbSchemaBuilder = dbSchemaBuilder;
    this.pgToDbMeta = pgToDbMeta;
    this.logger = loggerFactory.create('SchemaBuilder');
    this.graphQlConfig = config.getConfig('graphql');
    this.ENVIRONMENT = config.ENVIRONMENT;

    bootLoader.addBootFunction(this.boot.bind(this));

    this.getDbSchemaBuilder().addMigrationPath(__dirname + '/..');
  }

  public getDbSchemaBuilder() {
    return this.dbSchemaBuilder;
  }

  public registerDirectiveParser(...args: any[]) {
    return registerDirectiveParser(args[0], args[1]);
  }

  public async getPgDbMeta(): Promise<IDbMeta> {
    return await this.pgToDbMeta.getPgDbMeta();
  }

  public addParser(parser) {
    this.parsers.push(parser);
  }

  public getDbMeta() {
    return this.dbMeta;
  }

  public extendSchema(schema: string) {
    this.gQlSdlExtensions.push(schema);
  }

  public getGQlRuntimeObject() {
    return {
      dbMeta: this.dbMeta,
      views: this.views,
      expressions: this.expressions,
      gQlRuntimeDocument: this.gQlRuntimeDocument,
      gQlRuntimeSchema: this.gQlRuntimeSchema,
      gQlTypes: this.gQlTypes,
      mutations: this.mutations,
      queries: this.queries,
      customOperations: this.customOperations
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

  private async boot(): Promise<any> {

    try {

      // load schema
      const gQlSdlPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
      this.gQlSdl = await helper.loadFilesByGlobPattern(gQlSdlPattern);

      // check if any files were loaded
      if (this.gQlSdl.length === 0) {
        this.logger.warn('boot.no.sdl.files.found');
        return;
      }

      // Combine all Schemas to a big one and add extensions from other modules
      const gQlSdlCombined = this.gQlSdl.concat(this.gQlSdlExtensions.slice()).join('\n');
      this.gQlAst = gQLHelper.helper.parseGraphQlSchema(gQlSdlCombined);

      this.dbMeta = parseGQlAstToDbMeta(this.gQlAst);

      // load permissions and expressions and generate views and put them into schemas

      // load permissions
      const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
      const viewsArray = await helper.requireFilesByGlobPattern(viewsPattern);
      this.views = [].concat.apply([], viewsArray);

      // load expressions
      const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
      const expressionsArray = await helper.requireFilesByGlobPattern(expressionsPattern);
      this.expressions = [].concat.apply([], expressionsArray);

      const viewSchemaName = Container.get(Config).getConfig('db').viewSchemaName;

      const combinedSchemaInformation = gqlSchemaBuilder(this.gQlAst, this.views, this.expressions, this.dbMeta, viewSchemaName, this.parsers);

      this.gQlRuntimeDocument = combinedSchemaInformation.document;
      this.gQlRuntimeSchema = gQLHelper.helper.printGraphQlDocument(this.gQlRuntimeDocument);
      this.gQlTypes = combinedSchemaInformation.gQlTypes;
      this.queries = combinedSchemaInformation.queries;
      this.mutations = combinedSchemaInformation.mutations;

      this.customOperations = {
        fields: combinedSchemaInformation.customFields,
        queries: combinedSchemaInformation.customQueries,
        mutations: combinedSchemaInformation.customMutations
      };

      // copy view objects into dbMeta
      Object.values(combinedSchemaInformation.dbViews).forEach((dbView: any) => {
        if (this.dbMeta.schemas[dbView.viewSchemaName] == null) {
          this.dbMeta.schemas[dbView.viewSchemaName] = {
            tables: {},
            views: {}
          };
        }
        this.dbMeta.schemas[dbView.viewSchemaName].views[dbView.viewName] = dbView;
      });

      return this.dbMeta;

    } catch (err) {
      this.logger.warn('boot.error', err);
      throw err;
    }

  }

}
