import { Core, PoolClient, IModuleMigrationResult, Pool, DI, Logger } from "soniq";
import { Server, Koa } from "@soniq/server";

import { applyMiddleware } from "./gqlHttpEndpoint";
import {
  ICustomFieldResolver,
  ICustomResolverObject,
  ICustomResolverMeta,
  ICustomResolverCreator,
} from "./resolverTransactions";
import { HookManager, TPreQueryHookFunction } from "./hooks";
import { OperatorsBuilder, IOperatorsByName } from "./logicalOperators";
import { ReturnIdHandler } from "./resolverTransactions/ReturnIdHandler";
import { RevertibleResult } from "./resolverTransactions/RevertibleResult";
import {
  getBeginTransactionResolver,
  getCommitTransactionResolver,
} from "./resolverTransactions/getTransactionMutationResolvers";
import { getTransactionMutationTypeDefs } from "./resolverTransactions/getTransactionMutationTypeDefs";
import { AuthenticationError, ForbiddenError, UserInputError, InternalServerError } from "./GraphqlErrors";
import { Migration } from "./migration/Migration";
import { IQueryBuildObject, IMutationBuildObject } from "./getDefaultResolvers";
import { migrate } from "./basicMigration";
import { createMergeResultFunction } from "./migration/helpers";
import { IResolverMapping } from "./moduleDefinition/RuntimeInterfaces";
import { makeSchema } from "./runtime/schema";
import { GraphQLSchema } from "graphql";
import { GraphQlClient } from "./runtime/client";
import { IGraphqlAppConfig, IGraphqlRunConfig } from "./moduleDefinition/interfaces";
export {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  InternalServerError,
  ReturnIdHandler,
  RevertibleResult,
  ICustomResolverObject,
  ICustomResolverMeta,
  ICustomResolverCreator,
  ICustomFieldResolver,
  IQueryBuildObject,
  IMutationBuildObject,
  Migration,
};

export * from "./migration/DbSchemaInterface";
export * from "./migration/columnExtensions/IColumnExtension";
export * from "./migration/tableExtensions/ITableExtension";
export * from "./migration/schemaExtensions/ISchemaExtension";
export * from "./migration/postProcessingExtensions/IPostProcessingExtension";
export * from "./migration/helpers";
export * from "./migration/ExpressionCompiler";
export * from "./migration/interfaces";

export * from "./moduleDefinition";
export * from "./moduleDefinition/interfaces";
export * from "./runtime/client";
export * from "graphql";

export interface IExtensionResolversObject {
  [key: string]: ICustomResolverObject;
}
export interface IExtensionSchemaExtension {
  [key: string]: string;
}

@DI.singleton()
export class GraphQl {
  // DI
  private _server: Server;
  private _resolvers: ICustomResolverObject = {};
  private _resolverMappings: IResolverMapping[] = [];
  private _schemaExtensions: string[] = [];

  private _moduleRunConfig: IGraphqlRunConfig | null = null;
  private _pgPool: Pool | null = null;
  private _schema: GraphQLSchema | null = null;
  private _core: Core;
  private _migration: Migration = new Migration();
  private _operatorsBuilder: OperatorsBuilder = new OperatorsBuilder();
  private _hookManager: HookManager = new HookManager();
  private _logger: Logger;

  private _appConfig: IGraphqlAppConfig;

  public constructor(@DI.inject(Core) core: Core, @DI.inject(Server) server: Server) {
    this._server = server;
    this._core = core;

    this._logger = core.getLogger("GraphQl");

    this._appConfig = this._core.initModule({
      key: this.constructor.name,
      shouldMigrate: this._shouldMigrate.bind(this),
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });

    this._migration.addTypeDefsExtension(() => getTransactionMutationTypeDefs());
    this._migration.addTypeDefsExtension(() => this._operatorsBuilder.buildTypeDefs());
  }

  private _shouldMigrate(): string {
    return JSON.stringify(this._appConfig.schema);
  }

  private async _migrate(pgClient: PoolClient): Promise<IModuleMigrationResult> {
    const result: IModuleMigrationResult = {
      moduleRunConfig: {},
      commands: [],
      errors: [],
      warnings: [],
    };
    const mergeResult: (newResult: IModuleMigrationResult) => void = createMergeResultFunction(result);

    const basicResult: IModuleMigrationResult = await migrate(this, pgClient);
    mergeResult(basicResult);

    const userResult: IModuleMigrationResult = await this._migration.generateSchemaMigrationCommands(
      this._appConfig.schema,
      pgClient
    );
    mergeResult(userResult);

    result.moduleRunConfig = userResult.moduleRunConfig;

    return result;
  }
  private async _boot(moduleRunConfig: IGraphqlRunConfig, pgPool: Pool): Promise<void> {
    this._moduleRunConfig = moduleRunConfig;
    this._pgPool = pgPool;

    this.addMutationResolver("beginTransaction", false, getBeginTransactionResolver(pgPool, this._logger));
    this.addMutationResolver("commitTransaction", true, getCommitTransactionResolver(pgPool, this._logger));

    const app: Koa = this._server.getApp();

    this._schema = await makeSchema(
      moduleRunConfig,
      this._appConfig,
      this._resolvers,
      pgPool,
      this._hookManager,
      this._logger,
      this._operatorsBuilder,
      this._resolverMappings,
      this._schemaExtensions
    );

    return applyMiddleware(app, this._schema, this._appConfig, this._logger);
  }
  /* =====================================================================
      EXTERNAL EXTENSIONS
  ====================================================================== */
  public addMutationResolver(
    name: string,
    usesPgClientFromContext: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: ICustomFieldResolver<any, any>
  ): void {
    this._addResolver("Mutation", name, usesPgClientFromContext, resolver);
  }
  public addQueryResolver(
    name: string,
    usesPgClientFromContext: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: ICustomFieldResolver<any, any>
  ): void {
    this._addResolver("Query", name, usesPgClientFromContext, resolver);
  }
  private _addResolver(
    type: "Mutation" | "Query",
    name: string,
    usesPgClientFromContext: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: ICustomFieldResolver<any, any>
  ): void {
    const path: string = `${type}.${name}`;
    const key: string = `@soniq/graphql/generic/${path}`;
    this.addResolverMappings([
      {
        path,
        key,
        config: {},
      },
    ]);
    const resolversObject: ICustomResolverObject = {};

    resolversObject[key] = (resolverMapping: IResolverMapping) => {
      return {
        resolver,
        usesPgClientFromContext,
      };
    };

    this.addResolvers(resolversObject);
  }
  public addResolvers(resolversObject: ICustomResolverObject): void {
    this._resolvers = { ...this._resolvers, ...resolversObject };
  }
  public addResolverMappings(resolverMappings: IResolverMapping[]): void {
    this._resolverMappings = this._resolverMappings.concat(resolverMappings);
  }
  public addSchemaExtension(schemaExtension: string): void {
    this._schemaExtensions.push(schemaExtension);
  }
  public getMigration(): Migration {
    return this._migration;
  }
  public addOperators(operatorsByName: IOperatorsByName): void {
    this._operatorsBuilder.addOperators(operatorsByName);
  }
  public addPreQueryHook(hookFunction: TPreQueryHookFunction): void {
    this._hookManager.addPreQueryHook(hookFunction);
  }

  public getSchema(): GraphQLSchema {
    if (this._schema == null) {
      throw new Error("The GraphQLSchema is not available yet.");
    }
    return this._schema;
  }

  public getRunConfig(): IGraphqlRunConfig {
    if (this._moduleRunConfig == null) {
      throw new Error("The GraphQLSchema is not available yet.");
    }
    return this._moduleRunConfig;
  }

  public getAppConfig(): IGraphqlAppConfig {
    return this._appConfig;
  }

  public getLogger(): Logger {
    return this._logger;
  }

  public getClient(): GraphQlClient {
    return new GraphQlClient(this);
  }
}
