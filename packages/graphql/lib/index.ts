import { GraphQLSchema, DefinitionNode } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { ApolloServer } from "apollo-server-koa";
import { ApolloClient } from "apollo-client";
import { SchemaLink } from "apollo-link-schema";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";

import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { SchemaBuilder, IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";
import { AHelper } from "@fullstack-one/helper";
import { Server } from "@fullstack-one/server";
import { ORM } from "@fullstack-one/db";

import IGraphQlConfig from "./IGraphQlConfig";
import { applyApolloMiddleware } from "./koaMiddleware";
import { getResolvers, ICustomFieldResolver, ICustomResolverObject } from "./resolvers";
import getDefaultResolvers from "./getDefaultResolvers";
import { operatorsSchemaExtension, operatorsDefinitionNode } from "./logicalOperators";
import { getOperationsObject } from "./operations";
import { HookManager, TPreQueryHookFunction } from "./hooks";
import { ReturnIdHandler } from "./ReturnIdHandler";
import { RevertibleResult } from "./RevertibleResult";
import { AuthenticationError, ForbiddenError, UserInputError, ApolloError } from "./GraphqlErrors";

export { ApolloServer, AuthenticationError, ForbiddenError, UserInputError, ApolloError, ReturnIdHandler, RevertibleResult };

@Service()
export class GraphQl {
  private graphQlConfig: IGraphQlConfig;
  private apolloSchema: GraphQLSchema | null = null;
  private readonly hookManager: HookManager;

  // DI
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  private schemaBuilder: SchemaBuilder;
  private server: Server;
  private resolvers: ICustomResolverObject = {};

  constructor(
    @Inject((type) => HookManager) hookManager: HookManager,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject((type) => Server) server: Server,
    @Inject((type) => ORM) private readonly orm: ORM
  ) {
    this.graphQlConfig = config.registerConfig("GraphQl", `${__dirname}/../config`);
    this.hookManager = hookManager;

    this.loggerFactory = loggerFactory;
    this.server = server;
    this.schemaBuilder = schemaBuilder;

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.ENVIRONMENT = config.ENVIRONMENT;

    if (operatorsSchemaExtension !== "") this.schemaBuilder.extendSchema(operatorsSchemaExtension);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    await this.addApplicationResolvers();

    const { gqlRuntimeDocument, dbMeta, resolverMeta } = this.schemaBuilder.getGQlRuntimeObject();

    (gqlRuntimeDocument.definitions as DefinitionNode[]).push(operatorsDefinitionNode);
    const typeDefs = this.schemaBuilder.print(gqlRuntimeDocument);

    this.addDefaultResolvers(resolverMeta, dbMeta);
    const operations = getOperationsObject(gqlRuntimeDocument);
    const resolvers = getResolvers(operations, this.resolvers, this.orm.createQueryRunner, this.logger);
    this.apolloSchema = makeExecutableSchema({ typeDefs, resolvers });

    const app = this.server.getApp();

    applyApolloMiddleware(app, this.apolloSchema, this.graphQlConfig, this.logger);
  }

  private async addApplicationResolvers(): Promise<void> {
    const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
    const resolversObject = await AHelper.requireFilesByGlobPatternAsObject<ICustomFieldResolver<any, any, any>>(resolversPattern);
    this.addResolvers(resolversObject);
  }

  private addDefaultResolvers(resolverMeta: IResolverMeta, dbMeta: IDbMeta): void {
    const defaultResolvers = getDefaultResolvers(
      resolverMeta,
      dbMeta,
      this.orm,
      this.logger,
      this.graphQlConfig.queryCostLimit,
      this.graphQlConfig.minQueryDepthToCheckCostLimit
    );
    this.addResolvers(defaultResolvers);
  }

  public addResolvers(resolversObject: ICustomResolverObject) {
    this.resolvers = { ...this.resolvers, ...resolversObject };
  }

  public addPreQueryHook(hookFunction: TPreQueryHookFunction): void {
    this.hookManager.addPreQueryHook(hookFunction);
  }

  public getApolloClient(accessToken: string | null = null, ctx: any = {}): ApolloClient<NormalizedCacheObject> {
    if (this.apolloSchema == null) {
      throw new Error("Please call getApolloClient after booting has completed.");
    }

    const resolverContext = accessToken != null ? { accessToken, ctx } : { accessToken: null, ctx: undefined };

    // Return a new client every time because, clearing the cache (using `apolloClient.cache.reset()`) could collide with other queries
    return new ApolloClient({
      ssrMode: true,
      cache: new InMemoryCache(),
      link: new SchemaLink({
        schema: this.apolloSchema,
        context: resolverContext
      })
    });
  }
}
