import { GraphQLSchema, DefinitionNode } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { ApolloServer } from "apollo-server-koa";
import { ApolloClient } from "apollo-client";
import { SchemaLink } from "apollo-link-schema";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";

import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { Config, IEnvironment } from "@fullstack-one/config";
import {
  Core,
  IModuleAppConfig,
  IModuleEnvConfig,
  PoolClient,
  IModuleMigrationResult,
  IModuleRuntimeConfig,
  Pool,
  TGetModuleRuntimeConfig,
  IModuleConfig
} from "@fullstack-one/core";
import { Server } from "@fullstack-one/server";

import IGraphQlConfig from "./IGraphQlConfig";
import { applyApolloMiddleware } from "./koaMiddleware";
import { getResolvers, ICustomFieldResolver, ICustomResolverObject, ICustomResolverMeta, ICustomResolverCreator } from "./resolverTransactions";
import { HookManager, TPreQueryHookFunction } from "./hooks";
import { OperatorsBuilder, IOperatorsByName } from "./logicalOperators";
import { ReturnIdHandler } from "./resolverTransactions/ReturnIdHandler";
import { RevertibleResult } from "./resolverTransactions/RevertibleResult";
import { getBeginTransactionResolver, getCommitTransactionResolver } from "./resolverTransactions/getTransactionMutationResolvers";
import { getTransactionMutationTypeDefs } from "./resolverTransactions/getTransactionMutationTypeDefs";
import { AuthenticationError, ForbiddenError, UserInputError, ApolloError } from "./GraphqlErrors";
import { Migration, ITypeDefsExtension, IResolverExtension } from "./migration/Migration";
import { IColumnExtension } from "./migration/columnExtensions/IColumnExtension";
import { ISchemaExtension } from "./migration/schemaExtensions/ISchemaExtension";
import { ITableExtension } from "./migration/tableExtensions/ITableExtension";
import { IRuntimeConfigGql } from "./RuntimeInterfaces";
import getDefaultResolvers from "./getDefaultResolvers";
import { migrate } from "./basicMigration";
import { createMergeResultFunction } from "./migration/helpers";
import { IPostProcessingExtension } from "./migration/postProcessingExtensions/IPostProcessingExtension";
export {
  ApolloServer,
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  ApolloError,
  ReturnIdHandler,
  RevertibleResult,
  ICustomResolverObject,
  ICustomResolverMeta,
  ICustomResolverCreator,
  ICustomFieldResolver
};

export * from "./migration/DbSchemaInterface";
export * from "./migration/columnExtensions/IColumnExtension";
export * from "./migration/tableExtensions/ITableExtension";
export * from "./migration/schemaExtensions/ISchemaExtension";
export * from "./migration/helpers";
export * from "./migration/ExpressionCompiler";
export * from "./migration/interfaces";

export * from "./schemaDefinition";

@Service()
export class GraphQl {
  private graphQlConfig: IGraphQlConfig;

  // DI
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  private server: Server;
  private resolvers: ICustomResolverObject = {};
  private core: Core;
  private migration: Migration = new Migration();
  private operatorsBuilder: OperatorsBuilder = new OperatorsBuilder();
  private hookManager: HookManager = new HookManager();

  constructor(
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => Core) core: Core,
    @Inject((type) => Server) server: Server
  ) {
    this.graphQlConfig = config.registerConfig("GraphQl", `${__dirname}/../config`);

    this.loggerFactory = loggerFactory;
    this.server = server;
    this.core = core;

    this.logger = this.loggerFactory.create(this.constructor.name);
    this.ENVIRONMENT = config.ENVIRONMENT;

    this.core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this.migrate.bind(this),
      boot: this.boot.bind(this)
    });

    this.addTypeDefsExtension(() => getTransactionMutationTypeDefs());
    this.addTypeDefsExtension(() => this.operatorsBuilder.buildTypeDefs());

    this.addResolverExtension(() => {
      return {
        path: "Mutation.beginTransaction",
        key: "@fullstack-one/graphql/Mutation/beginTransaction",
        config: {}
      };
    });

    this.addResolverExtension(() => {
      return {
        path: "Mutation.commitTransaction",
        key: "@fullstack-one/graphql/Mutation/commitTransaction",
        config: {}
      };
    });
  }
  private async migrate(appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    const result: IModuleMigrationResult = {
      moduleRuntimeConfig: {},
      commands: [],
      errors: [],
      warnings: []
    };
    const mergeResult = createMergeResultFunction(result);

    const basicResult = await migrate(this, appConfig, envConfig, pgClient);
    mergeResult(basicResult);

    const userResult = await this.migration.generateSchemaMigrationCommands(appConfig, envConfig, pgClient);
    mergeResult(userResult);

    result.moduleRuntimeConfig = userResult.moduleRuntimeConfig;

    return result;
  }
  private async boot(getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool) {
    this.addResolvers({
      "@fullstack-one/graphql/Mutation/beginTransaction": getBeginTransactionResolver(pgPool, this.logger),
      "@fullstack-one/graphql/Mutation/commitTransaction": getCommitTransactionResolver(pgPool, this.logger)
    });

    const app = this.server.getApp();

    applyApolloMiddleware(app, getRuntimeConfig, pgPool, this.resolvers, this.graphQlConfig, this.logger, this.hookManager, this.operatorsBuilder);
  }
  private async bootStudio(getModuleConfig: () => IModuleConfig, setModuleConfig: (moduleConfig: IModuleConfig) => void, server) {
    
  }
  /* =====================================================================
      EXTERNAL EXTENSIONS
  ====================================================================== */
  public addResolvers(resolversObject: ICustomResolverObject) {
    this.resolvers = { ...this.resolvers, ...resolversObject };
  }
  public addSchemaExtension(schemaExtension: ISchemaExtension) {
    this.migration.addSchemaExtension(schemaExtension);
  }
  public addTableExtension(tableExtension: ITableExtension) {
    this.migration.addTableExtension(tableExtension);
  }
  public addColumnExtension(columnExtension: IColumnExtension) {
    this.migration.addColumnExtension(columnExtension);
  }
  public addPostProcessingExtension(postProcessingExtension: IPostProcessingExtension) {
    this.migration.addPostProcessingExtension(postProcessingExtension);
  }
  public addTypeDefsExtension(typeDefs: ITypeDefsExtension) {
    this.migration.addTypeDefsExtension(typeDefs);
  }
  public addResolverExtension(resolverExtension: IResolverExtension) {
    this.migration.addResolverExtension(resolverExtension);
  }
  public getMigration(): Migration {
    return this.migration;
  }
  public addOperators(operatorsByName: IOperatorsByName) {
    this.operatorsBuilder.addOperators(operatorsByName);
  }
  public addPreQueryHook(hookFunction: TPreQueryHookFunction) {
    this.hookManager.addPreQueryHook(hookFunction);
  }
  public getColumnExtensionPropertySchemas() {
    return this.migration.getColumnExtensionPropertySchemas();
  }
}
