import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import * as apolloServer from "apollo-server-koa";
import { ApolloClient } from "apollo-client";
import { SchemaLink } from "apollo-link-schema";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";

import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { AHelper } from "@fullstack-one/helper";
import { Server } from "@fullstack-one/server";
import { DbGeneralPool } from "@fullstack-one/db";

import IGraphqlConfig from "../config/IGraphqlConfig";
import { getResolvers, ICustomFieldResolver, ICustomResolverObject } from "./resolvers";
import { createGraphQlKoaRouter } from "./createGraphQlKoaRouter";
import { getDefaultResolvers } from "./queryBuilder/resolvers";
import { operatorsObject } from "./compareOperators";
import { getOperations, IOperations } from "./getOperations";
import { getOperatorsDefinition } from "./getOperatorsDefinition";

export { apolloServer };

@Service()
export class GraphQl {
  private graphQlConfig: IGraphqlConfig;
  private apolloSchema: GraphQLSchema;

  // DI
  private config: Config;
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  private schemaBuilder: SchemaBuilder;
  private server: Server;
  private dbGeneralPool: DbGeneralPool;
  private resolvers: ICustomResolverObject = {};

  private hooks = {
    preQuery: [],
    // postQuery: No use case, since everything can be achieved with custom fields or permissions
    // preMutation = preQuery (Mutation is a Query in GraphQL)
    postMutation: [],
    preMutationCommit: []
  };

  constructor(
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => Config) config,
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => SchemaBuilder) schemaBuilder,
    @Inject((type) => Server) server,
    @Inject((type) => DbGeneralPool) dbGeneralPool
  ) {
    this.graphQlConfig = config.registerConfig("GraphQl", `${__dirname}/../config`);

    this.loggerFactory = loggerFactory;
    this.config = config;
    this.dbGeneralPool = dbGeneralPool;
    this.server = server;
    this.schemaBuilder = schemaBuilder;
    let extendSchema = "";

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.ENVIRONMENT = this.config.ENVIRONMENT;

    Object.values(operatorsObject).forEach((operator: any) => {
      if (operator.extendSchema != null) {
        extendSchema += `${operator.extendSchema}\n`;
      }
    });

    if (extendSchema !== "") {
      this.schemaBuilder.extendSchema(extendSchema);
    }

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
    this.addResolvers(await AHelper.requireFilesByGlobPatternAsObject<ICustomFieldResolver>(resolversPattern));

    const { gqlRuntimeDocument, dbMeta, resolverMeta } = this.schemaBuilder.getGQlRuntimeObject();

    const { gQlAst, operations } = this.prepareSchema(gqlRuntimeDocument, dbMeta, resolverMeta);

    this.apolloSchema = makeExecutableSchema({
      typeDefs: gQlAst,
      resolvers: getResolvers(operations, this.resolvers)
    });

    const gqlKoaRouter = createGraphQlKoaRouter(this.apolloSchema);
    this.server
      .getApp()
      .use(gqlKoaRouter.routes())
      .use(gqlKoaRouter.allowedMethods());
  }

  public addPreQueryHook(fn) {
    // TODO: Remove
    this.logger.warn("Function 'addPreQueryHook' is deprecated. Please use 'addHook(name, fn)'.");
    this.hooks.preQuery.push(fn);
  }

  public addHook(name, fn) {
    if (this.hooks[name] == null || Array.isArray(this.hooks[name]) !== true) {
      throw new Error(`The hook '${name}' does not exist.`);
    }
    this.hooks[name].push(fn);
  }

  public addResolvers(resolversObject: ICustomResolverObject) {
    this.resolvers = { ...this.resolvers, ...resolversObject };
  }

  public prepareSchema(gqlRuntimeDocument, dbMeta, resolverMeta): { gQlAst: string; operations: IOperations } {
    gqlRuntimeDocument.definitions.push(getOperatorsDefinition(operatorsObject));

    this.addResolvers(
      getDefaultResolvers(
        resolverMeta,
        this.hooks,
        dbMeta,
        this.dbGeneralPool,
        this.logger,
        this.graphQlConfig.queryCostLimit,
        this.graphQlConfig.minQueryDepthToCheckCostLimit
      )
    );
    const gQlAst = this.schemaBuilder.print(gqlRuntimeDocument);
    const operations = getOperations(gqlRuntimeDocument);

    return { gQlAst, operations };
  }

  public getApolloClient(accessToken: string = null, ctx: any = {}): ApolloClient<NormalizedCacheObject> {
    if (this.apolloSchema == null) {
      throw new Error("Please call getApolloClient after booting has completed.");
    }

    const schemaLinkContext = accessToken != null ? { ctx, accessToken } : { ctx: {}, accessToken: null };

    // Return a new client every time because, clearing the cache (using `apolloClient.cache.reset()`) could collide with other queries
    return new ApolloClient({
      ssrMode: true,
      cache: new InMemoryCache(),
      link: new SchemaLink({
        schema: this.apolloSchema,
        context: schemaLinkContext
      })
    });
  }
}
