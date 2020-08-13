import * as fs from "fs";
//@ts-ignore TODO: @eugene Koa-cors has no type-def
import * as koaCors from "@koa/cors";
import { DI } from "soniq";
import {
  Core,
  IModuleAppConfig,
  PoolClient,
  IModuleMigrationResult,
  Pool,
  TGetModuleRuntimeConfig,
  Logger,
} from "soniq";
import { Server, Koa } from "@soniq/server";
import {
  GraphQl,
  ReturnIdHandler,
  RevertibleResult,
  AuthenticationError,
  ICustomResolverObject,
  IQueryBuildObject,
  IMutationBuildObject,
} from "@soniq/graphql";

import { CSRFProtection } from "./CSRFProtection";
import { AuthConnector } from "./AuthConnector";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { AccessTokenParser } from "./AccessTokenParser";
import { AuthProvider } from "./AuthProvider";
import {
  IAuthFactorForProof,
  IUserAuthentication,
  ILoginData,
  IFindUserResponse,
  ITokenMeta,
  IAuthRuntimeConfig,
  TGetAuthModuleRuntimeConfig,
} from "./interfaces";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import * as _ from "lodash";
import { migrate } from "./migration";
import { AuthExtensionConnector } from "./ExtensionConnector";

const schema: string = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

export * from "./SignHelper";
export * from "./interfaces";
export * from "./AuthProviders/AuthProviderEmail";
export * from "./moduleDefinition";
export * from "./ExtensionConnector";

// TODO: @dustin Migrate oAuth to mig3
// export * from "./AuthProviders/AuthProviderOAuth";
export * from "./AuthProviders/AuthProviderPassword";
export { AuthProvider, IAuthFactorForProof };

@DI.singleton()
export class Auth {
  private _authRuntimeConfig: IAuthRuntimeConfig | null = null;
  private _cryptoFactory: CryptoFactory | null = null;
  private _signHelper: SignHelper | null = null;
  private _authQueryHelper: AuthQueryHelper | null = null;
  private _csrfProtection: CSRFProtection | null = null;
  private _accessTokenParser: AccessTokenParser | null = null;
  private _core: Core;
  private _graphQl: GraphQl;

  // DI
  private _logger: Logger;
  private _authProviders: AuthProvider[] = [];
  private _pgPool: Pool | null = null;
  public authConnector: AuthConnector | null = null;

  private _userRegistrationCallback: ((userAuthentication: IUserAuthentication) => void) | null = null;
  private _getRuntimeConfig: TGetAuthModuleRuntimeConfig = (updateKey?: string) => {
    throw new Error(`Cannot get RuntimeConfig while booting hasn't finished.`);
  };

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(
    @DI.inject(Core) core: Core,
    @DI.inject(Server) server: Server,
    @DI.inject(GraphQl) graphQl: GraphQl
  ) {
    this._graphQl = graphQl;
    this._core = core;

    this._logger = core.getLogger("Auth");

    this._core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
      createExtensionConnector: this._createExtensionConnector.bind(this),
    });
    // this.orm = orm;

    // graphQl.addPreQueryHook(this.preQueryHook.bind(this));

    // schemaBuilder.extendSchema(schema);
    graphQl.addTypeDefsExtension(() => {
      return schema;
    });

    graphQl.addPreQueryHook(this._preQueryHook.bind(this));

    graphQl.addResolvers(this._getResolvers());

    Object.keys(this._getResolvers())
      .map((key) => {
        // eslint-disable-next-line @typescript-eslint/typedef
        const splittedKey = key.split("/");

        return () => {
          return {
            path: `${splittedKey[2]}.${splittedKey[3]}`,
            key,
            config: {},
          };
        };
      })
      .forEach(graphQl.addResolverMappingExtension.bind(graphQl));

    // graphQl.addResolvers(this.getResolvers());

    this._addMiddleware(server);
  }

  private _createExtensionConnector(): AuthExtensionConnector {
    return new AuthExtensionConnector(this);
  }

  private async _migrate(appConfig: IModuleAppConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    const authFactorProviders: string = this._authProviders
      .map((authProvider) => {
        return authProvider.providerName;
      })
      .join(":");

    return migrate(this._graphQl, appConfig, pgClient, authFactorProviders);
  }
  private async _boot(getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool): Promise<void> {
    this._getRuntimeConfig = getRuntimeConfig;
    this._pgPool = pgPool;
    const { runtimeConfig } = await this._getRuntimeConfig();

    this._updateHelpers(runtimeConfig);
  }

  private _updateHelpers(runtimeConfig: IAuthRuntimeConfig): void {
    this._cryptoFactory = new CryptoFactory(runtimeConfig.secrets.encryptionKey, runtimeConfig.crypto.algorithm);
    this._signHelper = new SignHelper(runtimeConfig.secrets.admin, runtimeConfig.secrets.root, this._cryptoFactory);

    this._authQueryHelper = new AuthQueryHelper(this.getPgPool(), this._logger, this._cryptoFactory, this._signHelper);
    this.authConnector = new AuthConnector(this.getAuthQueryHelper(), this._logger, this._cryptoFactory, runtimeConfig);

    this._authProviders.forEach((authProvider) => {
      authProvider._boot(this.getAuthConnector(), this.getAuthQueryHelper(), this.getSignHelper(), runtimeConfig);
    });
  }

  private _addMiddleware(server: Server): void {
    const app: Koa = server.getApp();

    // Prevent CSRF
    app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      const { runtimeConfig, hasBeenUpdated } = await this._getRuntimeConfig("CSRF");

      if (hasBeenUpdated) {
        this._updateHelpers(runtimeConfig);

        app.keys = [runtimeConfig.secrets.cookie];
        app.proxy = runtimeConfig.isServerBehindProxy === true ? true : false;
      }

      if (hasBeenUpdated || this._csrfProtection == null) {
        this._csrfProtection = new CSRFProtection(this._logger, runtimeConfig);
      }

      await this._csrfProtection.createSecurityContext(ctx, next);
    });

    // Allow CORS requests
    app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      const { runtimeConfig } = await this._getRuntimeConfig();

      // TODO: There is no typedef in koa-Cors
      // eslint-disable-next-line @typescript-eslint/typedef
      const corsOptions = {
        ...runtimeConfig.corsOptions,
        origin: (kctx: Koa.Context) => {
          return kctx.request.get("origin");
        },
      };

      return koaCors(corsOptions)(ctx, next);
    });

    // Parse AccessToken
    app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      const { runtimeConfig, hasBeenUpdated } = await this._getRuntimeConfig("ACCESS_TOKEN");

      if (hasBeenUpdated || this._accessTokenParser == null) {
        this._accessTokenParser = new AccessTokenParser(runtimeConfig);
      }

      return this._accessTokenParser.parse(ctx, next);
    });
  }

  private async _preQueryHook(
    pgClient: PoolClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
    authRequired: boolean,
    buildObject: IMutationBuildObject | IQueryBuildObject,
    useContextPgClient: boolean
  ): Promise<void> {
    // Do nothing if this is a custom transaction
    if (useContextPgClient === true) {
      return;
    }

    // If the current request is a query (not a mutation)
    if (context._isRequestGqlQuery === true) {
      if (authRequired === true && context.accessToken != null) {
        try {
          await this.getAuthQueryHelper().authenticateTransaction(pgClient, context.accessToken);
        } catch (err) {
          this._logger.trace("authenticateTransaction.failed", err);
          if (context.ctx != null) {
            await this._deleteAccessTokenCookie(context.ctx);
          }
          throw err;
        }
      }
      const queryBuildObject: IQueryBuildObject = buildObject as IQueryBuildObject;
      // Set root when required
      if (queryBuildObject.useRootViews === true) {
        await this.getAuthQueryHelper().setRoot(pgClient);
      }
    } else {
      if (authRequired === true) {
        if (context.accessToken != null) {
          if (context._transactionIsAuthenticated !== true) {
            try {
              await this.getAuthQueryHelper().authenticateTransaction(pgClient, context.accessToken);
              // eslint-disable-next-line require-atomic-updates
              context._transactionIsAuthenticated = true;
            } catch (err) {
              this._logger.trace("authenticateTransaction.failed", err);
              if (context.ctx != null) {
                await this._deleteAccessTokenCookie(context.ctx);
              }
              throw err;
            }
          }
        } else {
          throw new AuthenticationError("Authentication is required for this mutation. AccessToken missing.");
        }
      } else {
        if (context._transactionIsAuthenticated === true) {
          try {
            await this.getAuthQueryHelper().unauthenticateTransaction(pgClient);
            // eslint-disable-next-line require-atomic-updates
            context._transactionIsAuthenticated = false;
          } catch (err) {
            this._logger.trace("unauthenticateTransaction.failed", err);
            throw err;
          }
        }
      }
    }
  }

  private async _setAccessTokenCookie(ctx: Koa.Context, loginData: ILoginData): Promise<void> {
    const { runtimeConfig } = await this._getRuntimeConfig();

    // TODO: There is no type for that
    // eslint-disable-next-line @typescript-eslint/typedef
    const cookieOptions = {
      ...runtimeConfig.cookie,
      maxAge: loginData.tokenMeta.accessTokenMaxAgeInSeconds * 1000,
    };

    //@ts-ignore TODO: @eugene This is correct
    ctx.cookies.set(runtimeConfig.cookie.name, loginData.accessToken, cookieOptions);
  }

  private async _deleteAccessTokenCookie(ctx: Koa.Context): Promise<void> {
    const { runtimeConfig } = await this._getRuntimeConfig();
    //@ts-ignore TODO: @eugene This is correct
    ctx.cookies.set(runtimeConfig.cookie.name, null);
    //@ts-ignore TODO: @eugene This is correct
    ctx.cookies.set(`${runtimeConfig.cookie.name}.sig`, null);
  }

  private async _callAndHideErrorDetails(callback: (...args: unknown[]) => void): Promise<unknown> {
    try {
      return await callback();
    } catch (error) {
      _.set(error, "extensions.hideDetails", true);
      throw error;
    }
  }

  private _getResolvers(): ICustomResolverObject {
    return {
      "@fullstack-one/auth/Mutation/getUserIdentifier": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              const userIdentifierObject: IFindUserResponse = await this.getAuthConnector().findUser(
                pgClient,
                args.username,
                args.tenant || null
              );
              if (returnIdHandler.setReturnId(userIdentifierObject.userIdentifier)) {
                return "Token hidden due to returnId usage.";
              }
              return userIdentifierObject.userIdentifier;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/login": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              const clientIdentifier: string | null = context.ctx.securityContext.clientIdentifier;

              const loginData: ILoginData = await this.getAuthConnector().login(
                pgClient,
                args.authFactorProofTokens.map(returnIdHandler.getReturnId.bind(returnIdHandler)),
                clientIdentifier || null
              );

              if (context.ctx.securityContext.isBrowser === true) {
                await this._setAccessTokenCookie(context.ctx, loginData);

                loginData.accessToken = null;
              }
              return loginData;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/modifyAuthFactors": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              // tslint:disable-next-line:prettier
              await this.getAuthConnector().modifyAuthFactors(
                pgClient,
                args.authFactorProofTokens.map(returnIdHandler.getReturnId.bind(returnIdHandler)),
                args.isActive,
                args.loginProviderSets,
                args.modifyProviderSets,
                args.authFactorCreationTokens.map(returnIdHandler.getReturnId.bind(returnIdHandler)),
                args.removeAuthFactorIds.map(returnIdHandler.getReturnId.bind(returnIdHandler))
              );
              return true;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/proofAuthFactor": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              await this.getAuthConnector().proofAuthFactor(
                pgClient,
                returnIdHandler.getReturnId(args.authFactorProofToken)
              );
              return true;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/invalidateAccessToken": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              if (context.ctx != null) {
                await this._deleteAccessTokenCookie(context.ctx);
              }
              await this.getAuthConnector().invalidateAccessToken(pgClient, context.accessToken);
              return true;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/invalidateAllAccessTokens": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              if (context.ctx != null) {
                await this._deleteAccessTokenCookie(context.ctx);
              }
              await this.getAuthConnector().invalidateAllAccessTokens(pgClient, context.accessToken);
              return true;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/refreshAccessToken": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              const clientIdentifier: string | null = context.ctx.securityContext.clientIdentifier;

              // TODO: This is a security issue refreshAccessToken should accept null as clientIdentifier
              if (clientIdentifier == null) {
                throw new Error("Cannt refresh without Client Identifier.");
              }

              const loginData: ILoginData = await this.getAuthConnector().refreshAccessToken(
                pgClient,
                context.accessToken,
                clientIdentifier,
                args.refreshToken
              );

              if (context.ctx.securityContext.isBrowser === true) {
                await this._setAccessTokenCookie(context.ctx, loginData);

                loginData.accessToken = null;
              }
              return loginData;
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/getTokenMeta": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;
              try {
                const tokenMeta: ITokenMeta = await this.getAuthConnector().getTokenMeta(pgClient, context.accessToken);
                return tokenMeta;
              } catch (err) {
                if (context.ctx != null) {
                  await this._deleteAccessTokenCookie(context.ctx);
                }
                throw err;
              }
            });
          },
        };
      },
      "@fullstack-one/auth/Mutation/createUserAuthentication": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this._callAndHideErrorDetails(async () => {
              const pgClient: PoolClient = context._transactionPgClient;

              const userAuthenticationId: string = await this.getAuthConnector().createUserAuthentication(
                pgClient,
                returnIdHandler.getReturnId(args.userId),
                args.isActive || true,
                args.loginProviderSets,
                args.modifyProviderSets,
                args.authFactorCreationTokens.map(returnIdHandler.getReturnId.bind(returnIdHandler))
              );

              return new RevertibleResult(
                userAuthenticationId,
                async () => {
                  /* Rollback happens with db-client-transaction */
                },
                async () => {
                  await this.getAuthQueryHelper().transaction(async (pgClientInternal) => {
                    const userAuthentication: IUserAuthentication = await this.getAuthConnector().getUserAuthenticationById(
                      pgClientInternal,
                      userAuthenticationId
                    );
                    if (this._userRegistrationCallback) {
                      this._userRegistrationCallback(userAuthentication);
                    }
                  });
                }
              );
            });
          },
        };
      },
      "@fullstack-one/auth/Query/getUserAuthentication": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info) => {
            return this._callAndHideErrorDetails(async () => {
              return this.getAuthQueryHelper().transaction(
                async (pgClientInternal) => {
                  return this.getAuthConnector().getUserAuthentication(pgClientInternal, context.accessToken);
                },
                { accessToken: context.accessToken }
              );
            });
          },
        };
      },
    };
  }

  public registerUserRegistrationCallback(callback: (userAuthentication: IUserAuthentication) => void): void {
    if (this._userRegistrationCallback != null) {
      throw new Error("Auth 'registerUserRegistrationCallback' can only be called once.");
    }
    this._userRegistrationCallback = callback;
  }

  public createAuthProvider(
    providerName: string,
    authFactorProofTokenMaxAgeInSeconds: number | null = null
  ): AuthProvider {
    const authProvider: AuthProvider = new AuthProvider(
      providerName,
      this.authConnector,
      this._authQueryHelper,
      this._signHelper,
      this._logger,
      this._authRuntimeConfig,
      authFactorProofTokenMaxAgeInSeconds
    );

    this._authProviders.push(authProvider);

    return authProvider;
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    if (this._authQueryHelper == null) {
      throw new Error(`The AuthQueryHelper has not been initialised yet. Please boot first.`);
    }
    return this._authQueryHelper;
  }

  public getAuthConnector(): AuthConnector {
    if (this.authConnector == null) {
      throw new Error(`The AuthConnector has not been initialised yet. Please boot first.`);
    }
    return this.authConnector;
  }

  public getPgPool(): Pool {
    if (this._pgPool == null) {
      throw new Error(`The PgPool has not been initialised yet. Please boot first.`);
    }
    return this._pgPool;
  }

  public getSignHelper(): SignHelper {
    if (this._signHelper == null) {
      throw new Error(`The SignHelper has not been initialised yet. Please boot first.`);
    }
    return this._signHelper;
  }
}
