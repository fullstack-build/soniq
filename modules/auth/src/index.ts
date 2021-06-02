import * as fs from "fs";
//@ts-ignore TODO: @eugene Koa-cors has no type-def
import * as koaCors from "@koa/cors";
import { DI } from "soniq";
import { Core, PoolClient, IModuleMigrationResult, Pool, Logger } from "soniq";
import { Server, Koa } from "@soniq/server";
import {
  GraphQl,
  ReturnIdHandler,
  RevertibleResult,
  AuthenticationError,
  IQueryBuildObject,
  IMutationBuildObject,
} from "@soniq/graphql";

import { CSRFProtection } from "./CSRFProtection";
import { AuthConnector } from "./AuthConnector";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { AccessTokenParser } from "./AccessTokenParser";
import { AuthProvider } from "./AuthProvider";
import { IAuthFactorForProof, IUserAuthentication, ILoginData, IFindUserResponse, ITokenMeta } from "./interfaces";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import * as _ from "lodash";
import { migrate } from "./migration";
import { IAuthAppConfig } from "./moduleDefinition/interfaces";
import { sha256 } from "./crypto";

const schema: string = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

export * from "./SignHelper";
export * from "./interfaces";
export * from "./AuthProviders/AuthProviderEmail";
export * from "./moduleDefinition";

// TODO: @dustin Migrate oAuth to mig3
// export * from "./AuthProviders/AuthProviderOAuth";
export * from "./AuthProviders/AuthProviderPassword";
export { AuthProvider, IAuthFactorForProof };

@DI.singleton()
export class Auth {
  private _cryptoFactory: CryptoFactory;
  private _signHelper: SignHelper;
  private _authQueryHelper: AuthQueryHelper;
  private _core: Core;
  private _graphQl: GraphQl;

  // DI
  private _logger: Logger;
  private _authProviders: AuthProvider[] = [];
  private _pgPool: Pool | null = null;
  private _authConnector: AuthConnector;

  private _userRegistrationCallback: ((userAuthentication: IUserAuthentication) => void) | null = null;

  private _appConfig: IAuthAppConfig;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(
    @DI.inject(Core) core: Core,
    @DI.inject(Server) server: Server,
    @DI.inject(GraphQl) graphQl: GraphQl
  ) {
    this._graphQl = graphQl;
    this._core = core;

    this._logger = core.getLogger("Auth");

    this._appConfig = this._core.initModule({
      key: this.constructor.name,
      shouldMigrate: this._shouldMigrate.bind(this),
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });

    this._cryptoFactory = new CryptoFactory(this._appConfig.secrets.encryptionKey, this._appConfig.crypto.algorithm);
    this._signHelper = new SignHelper(this._appConfig.secrets.admin, this._appConfig.secrets.root, this._cryptoFactory);

    this._authQueryHelper = new AuthQueryHelper(
      this.getPgPool.bind(this),
      this._logger,
      this._cryptoFactory,
      this._signHelper
    );
    this._authConnector = new AuthConnector(
      this.getAuthQueryHelper(),
      this._logger,
      this._cryptoFactory,
      this._appConfig
    );
    // this.orm = orm;

    // graphQl.addPreQueryHook(this.preQueryHook.bind(this));

    graphQl.addSchemaExtension(schema);

    graphQl.addPreQueryHook(this._preQueryHook.bind(this));

    this._addResolvers(graphQl);

    this._addMiddleware(server);
  }

  private _shouldMigrate(): string {
    const authFactorProviders: string = this._authProviders
      .map((authProvider) => {
        return authProvider.providerName;
      })
      .join(":");
    return sha256(
      JSON.stringify({
        authFactorProviders,
        pgConfig: this._appConfig.pgConfig,
        secrets: {
          root: this._appConfig.secrets.root,
          admin: this._appConfig.secrets.admin,
        },
      })
    );
  }

  private async _migrate(pgClient: PoolClient): Promise<IModuleMigrationResult> {
    const authFactorProviders: string = this._authProviders
      .map((authProvider) => {
        return authProvider.providerName;
      })
      .join(":");

    return migrate(this._graphQl, this._appConfig, pgClient, authFactorProviders);
  }
  private async _boot(moduleRuntimeConfig: {}, pgPool: Pool): Promise<void> {
    this._pgPool = pgPool;
  }

  private _addMiddleware(server: Server): void {
    const app: Koa = server.getApp();

    app.keys = [this._appConfig.secrets.cookie];
    app.proxy = this._appConfig.isServerBehindProxy === true ? true : false;

    // Prevent CSRF
    const csrfProtection: CSRFProtection = new CSRFProtection(this._logger, this._appConfig);
    app.use(csrfProtection.createSecurityContext.bind(csrfProtection));

    // TODO: There is no typedef in koa-Cors
    // eslint-disable-next-line @typescript-eslint/typedef
    const corsOptions = {
      ...this._appConfig.corsOptions,
      origin: (kctx: Koa.Context) => {
        return kctx.request.get("origin");
      },
    };
    // Allow CORS requests
    app.use(koaCors(corsOptions));

    // Parse AccessToken
    const accessTokenParser: AccessTokenParser = new AccessTokenParser(this._appConfig);
    app.use(accessTokenParser.parse.bind(accessTokenParser));
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
    // TODO: There is no type for that
    // eslint-disable-next-line @typescript-eslint/typedef
    const cookieOptions = {
      ...this._appConfig.cookie,
      maxAge: loginData.tokenMeta.accessTokenMaxAgeInSeconds * 1000,
    };

    //@ts-ignore TODO: @eugene This is correct
    ctx.cookies.set(this._appConfig.cookie.name, loginData.accessToken, cookieOptions);
  }

  private async _deleteAccessTokenCookie(ctx: Koa.Context): Promise<void> {
    //@ts-ignore TODO: @eugene This is correct
    ctx.cookies.set(this._appConfig.cookie.name, null);
    //@ts-ignore TODO: @eugene This is correct
    ctx.cookies.set(`${this._appConfig.cookie.name}.sig`, null);
  }

  private async _callAndHideErrorDetails(callback: (...args: unknown[]) => void): Promise<unknown> {
    try {
      return await callback();
    } catch (error) {
      _.set(error, "extensions.hideDetails", true);
      throw error;
    }
  }

  private _addResolvers(graphQl: GraphQl): void {
    graphQl.addMutationResolver(
      "getUserIdentifier",
      true,
      async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
        return this._callAndHideErrorDetails(async () => {
          const pgClient: PoolClient = context._transactionPgClient;
          const userIdentifierObject: IFindUserResponse = await this.getAuthConnector().findUser(
            pgClient,
            args.username,
            args.tenant || "default"
          );
          if (returnIdHandler.setReturnId(userIdentifierObject.userIdentifier)) {
            return "Token hidden due to returnId usage.";
          }
          return userIdentifierObject.userIdentifier;
        });
      }
    );
    graphQl.addMutationResolver("login", true, async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
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
    });
    graphQl.addMutationResolver(
      "modifyAuthFactors",
      true,
      async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
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
      }
    );
    graphQl.addMutationResolver("proofAuthFactor", true, async (obj, args, context, info, returnIdHandler) => {
      return this._callAndHideErrorDetails(async () => {
        const pgClient: PoolClient = context._transactionPgClient;
        await this.getAuthConnector().proofAuthFactor(pgClient, returnIdHandler.getReturnId(args.authFactorProofToken));
        return true;
      });
    });
    graphQl.addMutationResolver("invalidateAccessToken", true, async (obj, args, context, info, returnIdHandler) => {
      return this._callAndHideErrorDetails(async () => {
        const pgClient: PoolClient = context._transactionPgClient;
        if (context.ctx != null) {
          await this._deleteAccessTokenCookie(context.ctx);
        }
        await this.getAuthConnector().invalidateAccessToken(pgClient, context.accessToken);
        return true;
      });
    });
    graphQl.addMutationResolver("invalidateAllAccessTokens", true, async (obj, args, context, info) => {
      return this._callAndHideErrorDetails(async () => {
        const pgClient: PoolClient = context._transactionPgClient;
        if (context.ctx != null) {
          await this._deleteAccessTokenCookie(context.ctx);
        }
        await this.getAuthConnector().invalidateAllAccessTokens(pgClient, context.accessToken);
        return true;
      });
    });
    graphQl.addMutationResolver("refreshAccessToken", true, async (obj, args, context, info) => {
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
    });
    graphQl.addMutationResolver("getTokenMeta", true, async (obj, args, context, info) => {
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
    });
    graphQl.addMutationResolver("getTokenMeta", true, async (obj, args, context, info) => {
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
    });
    graphQl.addMutationResolver(
      "createUserAuthentication",
      true,
      async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
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
      }
    );
    graphQl.addQueryResolver("getUserAuthentication", false, async (obj, args, context, info) => {
      return this._callAndHideErrorDetails(async () => {
        return this.getAuthQueryHelper().transaction(
          async (pgClientInternal) => {
            return this.getAuthConnector().getUserAuthentication(pgClientInternal, context.accessToken);
          },
          { accessToken: context.accessToken }
        );
      });
    });
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
      this._authConnector,
      this._authQueryHelper,
      this._signHelper,
      this._logger,
      this._appConfig,
      authFactorProofTokenMaxAgeInSeconds
    );

    this._authProviders.push(authProvider);

    return authProvider;
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    return this._authQueryHelper;
  }

  public getAuthConnector(): AuthConnector {
    return this._authConnector;
  }

  public getPgPool(): Pool {
    if (this._pgPool == null) {
      throw new Error(`The PgPool has not been initialised yet. Please boot first.`);
    }
    return this._pgPool;
  }

  public getSignHelper(): SignHelper {
    return this._signHelper;
  }
}
