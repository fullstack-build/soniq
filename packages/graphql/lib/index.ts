import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import * as koaBody from 'koa-bodyparser';
import * as KoaRouter from 'koa-router';

import { getResolvers } from './queryBuilder/resolvers';

import { operatorsObject } from './compareOperators';

// fullstack-one core
import { Service, Inject, Container } from '@fullstack-one/di';
// DI imports
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { Config, IEnvironment } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';
import { SchemaBuilder } from '@fullstack-one/schema-builder';
import { helper } from '@fullstack-one/helper';
import { Server } from '@fullstack-one/server';
import { DbGeneralPool } from '@fullstack-one/db';
import { getParser } from './getParser';

@Service()
export class GraphQl {

  private graphQlConfig: any;

  // DI
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  private schemaBuilder: SchemaBuilder;
  private server: Server;
  private dbGeneralPool: DbGeneralPool;
  private resolvers: any = {};
  private customQueries: any = [];
  private customMutations: any = [];
  private customFields: any = {};

  private hooks = {
    preQuery: [],
    postMutation: [],
    preMutationCommit: []
  };

  constructor (
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(type => Config) config?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => SchemaBuilder) schemaBuilder?,
    @Inject(type => Server) server?,
    @Inject(type => DbGeneralPool) dbGeneralPool?
    ) {
    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.dbGeneralPool = dbGeneralPool;
    this.server = server;
    this.schemaBuilder = schemaBuilder;
    this.logger = loggerFactory.create('GraphQl');
    this.graphQlConfig = config.getConfig('graphql');
    this.ENVIRONMENT = config.ENVIRONMENT;

    let extendSchema = '';

    Object.values(operatorsObject).forEach((operator: any) => {
      if (operator.extendSchema != null) {
        extendSchema += operator.extendSchema + '\n';
      }
    });

    if (extendSchema !== '') {
      this.schemaBuilder.extendSchema(extendSchema);
    }

    this.schemaBuilder.addParser(getParser(operatorsObject));

    // add boot function to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public addPreQueryHook(fn) {
    this.logger.warn(`Function 'addPreQueryHook' is deprecated. Please use 'addHook(name, fn)'.`);
    this.hooks.preQuery.push(fn);
  }

  public addHook(name, fn) {
    if (this.hooks[name] == null || Array.isArray(this.hooks[name]) !== true) {
      throw new Error(`The hook '${name}' does not exist.`);
    }
    this.hooks[name].push(fn);
  }

  public addResolvers(resolversObject) {
    this.resolvers = Object.assign(this.resolvers, resolversObject);
  }

  public addCustomQuery(operation) {
    this.customQueries.push(operation);
  }

  public addCustomMutation(operation) {
    this.customMutations.push(operation);
  }

  public addCustomFields(operations) {
    this.customFields = Object.assign(this.customFields, operations);
  }

  private async boot() {

    const gqlKoaRouter = new KoaRouter();

    // Load resolvers
    const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
    this.addResolvers(await helper.requireFilesByGlobPatternAsObject(resolversPattern));

    const gQlRuntimeObject = this.schemaBuilder.getGQlRuntimeObject();

    let customOperations: any = {};
    if (gQlRuntimeObject.customOperations == null) {
      this.logger.warn('boot.no.resolver.files.found');
      gQlRuntimeObject.customOperations = {};
      return;
    } else {
      customOperations = JSON.parse(JSON.stringify(gQlRuntimeObject.customOperations));
      customOperations.queries = customOperations.queries.concat(this.customQueries.slice());
      customOperations.mutations = customOperations.mutations.concat(this.customMutations.slice());
      customOperations.fields = Object.assign(customOperations.fields, this.customFields);
    }

    const schema = makeExecutableSchema({
      typeDefs: gQlRuntimeObject.gQlRuntimeSchema,
      resolvers: getResolvers(gQlRuntimeObject.gQlTypes, gQlRuntimeObject.dbMeta, gQlRuntimeObject.queries,
      gQlRuntimeObject.mutations, customOperations, this.resolvers, this.hooks, this.dbGeneralPool, this.logger),
    });

    const setCacheHeaders = async (ctx, next) => {
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
    gqlKoaRouter.post(this.graphQlConfig.endpoint, koaBody(), setCacheHeaders, graphqlKoa(gQlParam));
    gqlKoaRouter.get(this.graphQlConfig.endpoint, setCacheHeaders, graphqlKoa(gQlParam));
    // graphiql
    if (this.graphQlConfig.graphiQlEndpointActive) {
      gqlKoaRouter.get(this.graphQlConfig.graphiQlEndpoint, graphiqlKoa({ endpointURL: this.graphQlConfig.endpoint }));
    }

    const app = this.server.getApp();

    app.use(gqlKoaRouter.routes());
    app.use(gqlKoaRouter.allowedMethods());

  }

}
