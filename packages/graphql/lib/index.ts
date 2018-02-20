import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import * as koaBody from 'koa-bodyparser';
import * as KoaRouter from 'koa-router';

// fullstack-one core
import * as ONE from 'fullstack-one';

// import sub modules
import { graphQl as gQLHelper } from './helper';

import { runtimeParser } from './parser';
import { getResolvers } from './queryBuilder/resolvers';

// import interfaces
import { IViews, IExpressions } from './interfaces';
import { parseGraphQlJsonSchemaToDbMeta } from './graphQlSchemaToDbMeta';
// DI imports
import { LoggerFactory } from '@fullstack-one/logger';

@ONE.Service()
export class GraphQl extends ONE.AbstractPackage {

  private graphQlConfig: any;
  private sdlSchema: any;
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

  // DI
  @ONE.Inject(type => ONE.FullstackOneCore)
  private $one: ONE.FullstackOneCore;
  private logger: ONE.ILogger;
  @ONE.Inject('ENVIRONMENT')
  private ENVIRONMENT: ONE.IEnvironment;

  constructor (@ONE.Inject(type => LoggerFactory) loggerFactory?) {
    super();
    this.logger = loggerFactory.create('GraphQl');
    this.graphQlConfig = this.getConfig('graphql');
  }

  public async boot(): Promise<any> {

    try {

      // load schema
      const sdlSchemaPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
      this.sdlSchema = await ONE.helper.loadFilesByGlobPattern(sdlSchemaPattern);

      const sdlSchemaCombined = this.sdlSchema.join('\n');
      this.astSchema = gQLHelper.helper.parseGraphQlSchema(sdlSchemaCombined);

      this.dbMeta = parseGraphQlJsonSchemaToDbMeta(this.astSchema);

      // load permissions and expressions and generate views and put them into schemas
      try {

        // load permissions
        const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
        const viewsArray = await ONE.helper.requireFilesByGlobPattern(viewsPattern);
        this.views = [].concat.apply([], viewsArray);

        // load expressions
        const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
        const expressionsArray = await ONE.helper.requireFilesByGlobPattern(expressionsPattern);
        this.expressions = [].concat.apply([], expressionsArray);

        const combinedSchemaInformation = runtimeParser(this.astSchema, this.views, this.expressions, this.dbMeta);

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

  public getGraphQlSchema() {
    // return copy insted of ref
    return { ... this.sdlSchema };
  }

  public getGraphQlJsonSchema() {
    // return copy insted of ref
    return { ... this.astSchema };
  }

  public async addEndpoints() {

    const gqlRouter = new KoaRouter();

    // Load resolvers
    const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
    const resolversObject = await ONE.helper.requireFilesByGlobPatternAsObject(resolversPattern);

    const schema = makeExecutableSchema({
      typeDefs: this.gQlRuntimeSchema,
      resolvers: getResolvers(this.gQlTypes, this.dbMeta, this.queries, this.mutations, this.customOperations, resolversObject),
    });

    const setCacheHeaders = async (ctx, next) => {
      await next();
      let cacheHeader = 'no-store';
      // console.log(ctx.response.body, ctx.response.body != null , typeof ctx.response.body);
      // || (ctx.body != null && ctx.body.errors != null && ctx.body.errors.length > 0)
      if (ctx.state.includesMutation === true) {
        cacheHeader = 'no-store';
      } else {
        if (ctx.state.authRequired === true) {
          cacheHeader = 'privat, max-age=600';
        } else {
          cacheHeader = 'public, max-age=600';
        }
      }

      ctx.set('Cache-Control', cacheHeader);
    };

    const gQlParam = (ctx) => {
      ctx.state.authRequired = false;
      ctx.state.includesMutation = false;

      return {
        schema,
        context: {
          ctx,
          accessToken: ctx.state.accessToken
        }
      };
    };

    // koaBody is needed just for POST.
    gqlRouter.post('/graphql', koaBody(), setCacheHeaders, graphqlKoa(gQlParam));
    gqlRouter.get('/graphql', setCacheHeaders, graphqlKoa(gQlParam));

    gqlRouter.get(this.graphQlConfig.graphiQlEndpoint, graphiqlKoa({ endpointURL: this.graphQlConfig.endpoint }));

    this.$one.app.use(gqlRouter.routes());
    this.$one.app.use(gqlRouter.allowedMethods());

  }

}
