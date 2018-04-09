
// import sub modules
import { graphQl as gQLHelper } from './helper';

import { runtimeParser } from './parser';

// import interfaces
import { IViews, IExpressions } from './interfaces';
import { parseGraphQlJsonSchemaToDbMeta } from './graphQlSchemaToDbMeta';
// fullstack-one core
import { Service, Inject, Container } from '@fullstack-one/di';
// DI imports
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { Config, IEnvironment } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';
import { helper } from '@fullstack-one/helper';

export { IViews, IExpressions };

import * as utils from './parser/utils';
export { utils };

@Service()
export class GraphQlParser {

  private graphQlConfig: any;
  private sdlSchema: any;
  private sdlSchemaExtensions: any = [];
  private astSchema: any;
  private views: IViews;
  private expressions: IExpressions;
  private gQlRuntimeDocument: any;
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
    @Inject(type => BootLoader) bootLoader?
    ) {
    this.logger = loggerFactory.create('GraphQl');
    this.graphQlConfig = config.getConfig('graphql');
    this.ENVIRONMENT = config.ENVIRONMENT;

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public addParser(parser) {
    this.parsers.push(parser);
  }

  public getDbMeta() {
    return this.dbMeta;
  }

  public extendSchema(schema: string) {
    this.sdlSchemaExtensions.push(schema);
  }

  public getGqlRuntimeData() {
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

  public getGraphQlSchema() {
    // return copy insted of ref
    return { ... this.sdlSchema };
  }

  public getGraphQlJsonSchema() {
    // return copy insted of ref
    return { ... this.astSchema };
  }

  private async boot(): Promise<any> {

    try {

      // load schema
      const sdlSchemaPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
      this.sdlSchema = await helper.loadFilesByGlobPattern(sdlSchemaPattern);

      // Combine all Schemas to a big one and add extensions from other modules
      const sdlSchemaCombined = this.sdlSchema.concat(this.sdlSchemaExtensions.slice()).join('\n');
      this.astSchema = gQLHelper.helper.parseGraphQlSchema(sdlSchemaCombined);

      this.dbMeta = parseGraphQlJsonSchemaToDbMeta(this.astSchema);

      // load permissions and expressions and generate views and put them into schemas
      try {

        // load permissions
        const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
        const viewsArray = await helper.requireFilesByGlobPattern(viewsPattern);
        this.views = [].concat.apply([], viewsArray);

        // load expressions
        const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
        const expressionsArray = await helper.requireFilesByGlobPattern(expressionsPattern);
        this.expressions = [].concat.apply([], expressionsArray);

        const viewSchemaName = Container.get(Config).getConfig('db').viewSchemaName;

        const combinedSchemaInformation = runtimeParser(this.astSchema, this.views, this.expressions, this.dbMeta, viewSchemaName, this.parsers);

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

        Object.values(combinedSchemaInformation.dbViews).forEach((dbView: any) => {
          if (this.dbMeta.schemas[dbView.viewSchemaName] == null) {
            this.dbMeta.schemas[dbView.viewSchemaName] = {
              tables: {},
              views: {}
            };
          }
          this.dbMeta.schemas[dbView.viewSchemaName].views[dbView.viewName] = dbView;
        });

      } catch (err) {
        throw err;
      }

      return this.dbMeta;

    } catch (err) {
      this.logger.warn('boot.error', err);
    }

  }

}
