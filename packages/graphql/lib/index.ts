import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import * as koaBody from 'koa-bodyparser';
import * as KoaRouter from 'koa-router';

import { getResolvers } from './queryBuilder/resolvers';

// fullstack-one core
import { Service, Inject, Container } from '@fullstack-one/di';
// DI imports
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { Config, IEnvironment } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';
import { GraphQlParser } from '@fullstack-one/graphql-parser';
import { helper } from '@fullstack-one/helper';
import { Server } from '@fullstack-one/server';
import { Auth } from '@fullstack-one/auth';
import { DbGeneralPool } from '@fullstack-one/db';

@Service()
export class GraphQl {

  private graphQlConfig: any;

  // DI
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  private gqlParser: GraphQlParser;
  private server: Server;
  private dbGeneralPool: DbGeneralPool;
  private auth: Auth;

  constructor (
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(type => Config) config?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => GraphQlParser) gqlParser?,
    @Inject(type => Server) server?,
    @Inject(type => DbGeneralPool) dbGeneralPool?,
    @Inject(type => Auth) auth?
    ) {
    this.dbGeneralPool = dbGeneralPool;
    this.auth = auth;
    this.server = server;
    this.gqlParser = gqlParser;
    this.logger = loggerFactory.create('GraphQl');
    this.graphQlConfig = config.getConfig('graphql');
    this.ENVIRONMENT = config.ENVIRONMENT;

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  private async boot() {

    const gqlKoaRouter = new KoaRouter();

    // Load resolvers
    const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
    const resolversObject = await helper.requireFilesByGlobPatternAsObject(resolversPattern);

    const rd = this.gqlParser.getGqlRuntimeData();

    const schema = makeExecutableSchema({
      typeDefs: rd.gQlRuntimeSchema,
      resolvers: getResolvers(rd.gQlTypes, rd.dbMeta, rd.queries,
      rd.mutations, rd.customOperations, resolversObject, this.auth, this.dbGeneralPool),
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
    gqlKoaRouter.post('/graphql', koaBody(), setCacheHeaders, graphqlKoa(gQlParam));
    gqlKoaRouter.get('/graphql', setCacheHeaders, graphqlKoa(gQlParam));

    gqlKoaRouter.get(this.graphQlConfig.graphiQlEndpoint, graphiqlKoa({ endpointURL: this.graphQlConfig.endpoint }));

    const app = this.server.getApp();

    app.use(gqlKoaRouter.routes());
    app.use(gqlKoaRouter.allowedMethods());

  }

}
