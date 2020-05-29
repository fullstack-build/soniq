import { ApolloServer } from "apollo-server-koa";

import { Core, IModuleAppConfig, PoolClient, IModuleMigrationResult, Pool, DI, Logger } from "soniq";
import { Server, Koa } from "@soniq/server";

import { applyApolloMiddleware } from "./koaMiddleware";
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
import { AuthenticationError, ForbiddenError, UserInputError, ApolloError } from "./GraphqlErrors";
import { Migration, ITypeDefsExtension, IResolverExtension } from "./migration/Migration";
import { IColumnExtension } from "./migration/columnExtensions/IColumnExtension";
import { ISchemaExtension } from "./migration/schemaExtensions/ISchemaExtension";
import { ITableExtension } from "./migration/tableExtensions/ITableExtension";
import { IQueryBuildObject, IMutationBuildObject } from "./getDefaultResolvers";
import { migrate } from "./basicMigration";
import { createMergeResultFunction } from "./migration/helpers";
import { IPostProcessingExtension } from "./migration/postProcessingExtensions/IPostProcessingExtension";
import { TGetGraphqlModuleRuntimeConfig } from "./RuntimeInterfaces";
import { IPropertySchema } from "./migration/interfaces";
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
  ICustomFieldResolver,
  IQueryBuildObject,
  IMutationBuildObject,
};

export * from "./migration/DbSchemaInterface";
export * from "./migration/columnExtensions/IColumnExtension";
export * from "./migration/tableExtensions/ITableExtension";
export * from "./migration/schemaExtensions/ISchemaExtension";
export * from "./migration/helpers";
export * from "./migration/ExpressionCompiler";
export * from "./migration/interfaces";

export * from "./moduleDefinition";
export * from "./moduleDefinition/interfaces";

@DI.injectable()
export class GraphQl {
  // DI
  private _server: Server;
  private _resolvers: ICustomResolverObject = {};
  private _core: Core;
  private _migration: Migration = new Migration();
  private _operatorsBuilder: OperatorsBuilder = new OperatorsBuilder();
  private _hookManager: HookManager = new HookManager();
  private _logger: Logger;

  public constructor(@DI.inject(Core) core: Core, @DI.inject(Server) server: Server) {
    this._server = server;
    this._core = core;

    this._logger = core.getLogger("GraphQl");

    this._core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });

    this.addTypeDefsExtension(() => getTransactionMutationTypeDefs());
    this.addTypeDefsExtension(() => this._operatorsBuilder.buildTypeDefs());

    this.addResolverExtension(() => {
      return {
        path: "Mutation.beginTransaction",
        key: "@fullstack-one/graphql/Mutation/beginTransaction",
        config: {},
      };
    });

    this.addResolverExtension(() => {
      return {
        path: "Mutation.commitTransaction",
        key: "@fullstack-one/graphql/Mutation/commitTransaction",
        config: {},
      };
    });
  }
  private async _migrate(appConfig: IModuleAppConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    const result: IModuleMigrationResult = {
      moduleRuntimeConfig: {},
      commands: [],
      errors: [],
      warnings: [],
    };
    const mergeResult: (newResult: IModuleMigrationResult) => void = createMergeResultFunction(result);

    const basicResult: IModuleMigrationResult = await migrate(this, appConfig, pgClient);
    mergeResult(basicResult);

    const userResult: IModuleMigrationResult = await this._migration.generateSchemaMigrationCommands(
      appConfig,
      pgClient
    );
    mergeResult(userResult);

    result.moduleRuntimeConfig = userResult.moduleRuntimeConfig;

    return result;
  }
  private async _boot(getRuntimeConfig: TGetGraphqlModuleRuntimeConfig, pgPool: Pool): Promise<void> {
    this.addResolvers({
      "@fullstack-one/graphql/Mutation/beginTransaction": getBeginTransactionResolver(pgPool, this._logger),
      "@fullstack-one/graphql/Mutation/commitTransaction": getCommitTransactionResolver(pgPool, this._logger),
    });

    const app: Koa = this._server.getApp();

    return applyApolloMiddleware(
      app,
      getRuntimeConfig,
      pgPool,
      this._resolvers,
      this._logger,
      this._hookManager,
      this._operatorsBuilder
    );
  }
  /* =====================================================================
      EXTERNAL EXTENSIONS
  ====================================================================== */
  public addResolvers(resolversObject: ICustomResolverObject): void {
    this._resolvers = { ...this._resolvers, ...resolversObject };
  }
  public addSchemaExtension(schemaExtension: ISchemaExtension): void {
    this._migration.addSchemaExtension(schemaExtension);
  }
  public addTableExtension(tableExtension: ITableExtension): void {
    this._migration.addTableExtension(tableExtension);
  }
  public addColumnExtension(columnExtension: IColumnExtension): void {
    this._migration.addColumnExtension(columnExtension);
  }
  public addPostProcessingExtension(postProcessingExtension: IPostProcessingExtension): void {
    this._migration.addPostProcessingExtension(postProcessingExtension);
  }
  public addTypeDefsExtension(typeDefs: ITypeDefsExtension): void {
    this._migration.addTypeDefsExtension(typeDefs);
  }
  public addResolverExtension(resolverExtension: IResolverExtension): void {
    this._migration.addResolverExtension(resolverExtension);
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
  public getColumnExtensionPropertySchemas(): IPropertySchema[] {
    return this._migration.getColumnExtensionPropertySchemas();
  }
}
