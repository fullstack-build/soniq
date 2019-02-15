import { GraphQLSchema, DocumentNode, DefinitionNode } from "graphql";
import { makeExecutableSchema, IExecutableSchemaDefinition } from "graphql-tools";
import * as apolloServer from "apollo-server-koa";
import { ApolloClient } from "apollo-client";
import { SchemaLink } from "apollo-link-schema";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";

import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { SchemaBuilder, IDbMeta } from "@fullstack-one/schema-builder";
import { AHelper } from "@fullstack-one/helper";
import { Server } from "@fullstack-one/server";
import { DbGeneralPool } from "@fullstack-one/db";

import IGraphQlConfig from "../config/IGraphQlConfig";
import createGraphQlKoaRouter from "./createGraphQlKoaRouter";
import { getResolvers, ICustomFieldResolver, ICustomResolverObject } from "./resolvers";
import getDefaultResolvers from "./queryBuilder/getDefaultResolvers";
import { IHookObject } from "./queryBuilder/types";
import { operatorsSchemaExtension, operatorsDefinitionNode } from "./compareOperators";
import { getOperationsObject, IOperationsObject } from "./getOperations";

export { apolloServer };

@Service()
export class GraphQl {
  private graphQlConfig: IGraphQlConfig;
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

  private hookObject: IHookObject = {
    preQuery: [],
    preMutationCommit: [],
    postMutation: []
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

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.ENVIRONMENT = this.config.ENVIRONMENT;

    if (operatorsSchemaExtension !== "") this.schemaBuilder.extendSchema(operatorsSchemaExtension);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    await this.addApplicationResolvers();

    const { gqlRuntimeDocument, dbMeta, resolverMeta } = this.schemaBuilder.getGQlRuntimeObject();

    const { gQlAst, operations } = this.prepareSchema(gqlRuntimeDocument, dbMeta, resolverMeta);

    const schemaDefinition: IExecutableSchemaDefinition = {
      typeDefs: gQlAst,
      resolvers: getResolvers(operations, this.resolvers)
    };
    this.apolloSchema = makeExecutableSchema(schemaDefinition);

    const gqlKoaRouter = createGraphQlKoaRouter(this.apolloSchema, this.graphQlConfig);
    this.server
      .getApp()
      .use(gqlKoaRouter.routes())
      .use(gqlKoaRouter.allowedMethods());
  }

  private async addApplicationResolvers(): Promise<void> {
    const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
    const resolversObject = await AHelper.requireFilesByGlobPatternAsObject<ICustomFieldResolver<any, any, any>>(resolversPattern);
    this.addResolvers(resolversObject);
  }

  public addPreQueryHook(fn: any) {
    // TODO: Remove
    this.logger.warn("Function 'addPreQueryHook' is deprecated. Please use 'addHook(\"preQuery\", fn)'.");
    this.hookObject.preQuery.push(fn);
  }

  public addHook(name: string, fn: any) {
    if (this.hookObject[name] == null || Array.isArray(this.hookObject[name]) !== true) {
      throw new Error(`The hook '${name}' does not exist.`);
    }
    this.hookObject[name].push(fn);
  }

  public addResolvers(resolversObject: ICustomResolverObject) {
    this.resolvers = { ...this.resolvers, ...resolversObject };
  }

  public prepareSchema(gqlRuntimeDocument: DocumentNode, dbMeta: IDbMeta, resolverMeta: any): { gQlAst: string; operations: IOperationsObject } {
    const definitions = gqlRuntimeDocument.definitions as DefinitionNode[];
    definitions.push(operatorsDefinitionNode);

    this.addResolvers(
      getDefaultResolvers(
        resolverMeta,
        this.hookObject,
        dbMeta,
        this.dbGeneralPool,
        this.logger,
        this.graphQlConfig.queryCostLimit,
        this.graphQlConfig.minQueryDepthToCheckCostLimit
      )
    );
    const gQlAst = this.schemaBuilder.print(gqlRuntimeDocument);
    const operations = getOperationsObject(gqlRuntimeDocument);

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
