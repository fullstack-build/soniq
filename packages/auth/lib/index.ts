import * as fs from "fs";
import * as koaCors from "@koa/cors";
import { Service, Inject } from "@fullstack-one/di";
import {
  Core,
  IModuleAppConfig,
  IModuleEnvConfig,
  PoolClient,
  IModuleMigrationResult,
  IModuleRuntimeConfig,
  Pool,
  TGetModuleRuntimeConfig
} from "@fullstack-one/core";
import { Server } from "@fullstack-one/server";
import { Config } from "@fullstack-one/config";
import { GraphQl, ReturnIdHandler, RevertibleResult, UserInputError, AuthenticationError, ICustomResolverObject } from "@fullstack-one/graphql";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";

import { CSRFProtection } from "./CSRFProtection";
import { AuthConnector } from "./AuthConnector";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { AccessTokenParser } from "./AccessTokenParser";
import { AuthProvider } from "./AuthProvider";
import { IAuthFactorForProof, IUserAuthentication, ILoginData } from "./interfaces";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import * as _ from "lodash";
import { generateAuthSchema } from "./migration/basic";
import { migrate } from "./migration";

const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

export * from "./SignHelper";
export * from "./interfaces";
export * from "./AuthProviders/AuthProviderEmail";
export * from "./AuthProviders/AuthProviderOAuth";
export * from "./AuthProviders/AuthProviderPassword";
export { AuthProvider, IAuthFactorForProof };

@Service()
export class Auth {
  private authConfig;
  private cryptoFactory: CryptoFactory;
  private signHelper: SignHelper;
  private authQueryHelper: AuthQueryHelper;
  private csrfProtection: CSRFProtection;
  private accessTokenParser: AccessTokenParser;
  private core: Core;
  private graphQl: GraphQl;

  // DI
  private logger: ILogger;
  private loggerFactory: LoggerFactory;
  private userRegistrationCallback: (userAuthentication: IUserAuthentication) => void;

  public authConnector: AuthConnector;

  constructor(
    @Inject((type) => Core) core: Core,
    @Inject((type) => Server) server,
    // @Inject((type) => SchemaBuilder) schemaBuilder,
    @Inject((type) => Config) config,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory
  ) {
    // register package config
    this.authConfig = config.registerConfig("Auth", `${__dirname}/../config`);

    // orm.addMigrations(migrations);

    this.loggerFactory = loggerFactory;
    this.logger = loggerFactory.create(this.constructor.name);

    this.cryptoFactory = new CryptoFactory(this.authConfig.secrets.encryptionKey, this.authConfig.crypto.algorithm);
    this.signHelper = new SignHelper(this.authConfig.secrets.admin, this.cryptoFactory);

    this.authQueryHelper = new AuthQueryHelper(null, this.logger, this.cryptoFactory, this.signHelper);
    this.authConnector = new AuthConnector(this.authQueryHelper, this.logger, this.cryptoFactory, this.authConfig);
    this.csrfProtection = new CSRFProtection(this.logger, this.authConfig);
    this.accessTokenParser = new AccessTokenParser(this.authConfig);
    this.graphQl = graphQl;
    this.core = core;

    this.core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this.migrate.bind(this),
      boot: this.boot.bind(this)
    });
    // this.orm = orm;

    // graphQl.addPreQueryHook(this.preQueryHook.bind(this));

    // schemaBuilder.extendSchema(schema);
    graphQl.addTypeDefsExtension(() => {
      return schema;
    });

    graphQl.addPreQueryHook(this.preQueryHook.bind(this));

    graphQl.addResolvers(this.getResolvers());

    Object.keys(this.getResolvers())
      .map((key) => {
        const splittedKey = key.split("/");

        return () => {
          return {
            path: `${splittedKey[2]}.${splittedKey[3]}`,
            key,
            config: {}
          };
        };
      })
      .forEach(graphQl.addResolverExtension.bind(graphQl));

    // graphQl.addResolvers(this.getResolvers());

    this.addMiddleware(server);
  }
  private async migrate(appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    return migrate(this.graphQl, appConfig, envConfig, pgClient);
  }
  private async boot(getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool) {
    this.authQueryHelper.setPool(pgPool);
  }

  private addMiddleware(server: Server) {
    const app = server.getApp();
    app.keys = [this.authConfig.secrets.cookie];

    // If app.proxy === true koa will respect x-forwarded headers
    app.proxy = this.authConfig.isServerBehindProxy === true ? true : false;

    // Prevent CSRF
    app.use(this.csrfProtection.createSecurityContext.bind(this.csrfProtection));

    const corsOptions = {
      ...this.authConfig.corsOptions,
      origin: (ctx) => {
        return ctx.request.get("origin");
      }
    };

    // Allow CORS requests
    app.use(koaCors(corsOptions));

    // Parse AccessToken
    app.use(this.accessTokenParser.parse.bind(this.accessTokenParser));
  }

  private async preQueryHook(pgClient, context, authRequired: boolean, buildObject) {
    // If the current request is a query (not a mutation)
    if (context._isRequestGqlQuery === true) {
      if (authRequired === true) {
        if (context.accessToken != null) {
          try {
            await this.authQueryHelper.authenticateTransaction(pgClient, context.accessToken);
          } catch (err) {
            this.logger.trace("authenticateTransaction.failed", err);
            this.deleteAccessTokenCookie(context.ctx);
            throw err;
          }
        } else {
          if (this.authConfig.ignoreAuthErrorForUnauthenticatedQueriesToAuthViews !== true) {
            throw new AuthenticationError("Authentication is required for this query. AccessToken missing.");
          }
        }
      }
    } else {
      if (authRequired === true) {
        if (context.accessToken != null) {
          if (context._transactionIsAuthenticated !== true) {
            try {
              await this.authQueryHelper.authenticateTransaction(pgClient, context.accessToken);
              context._transactionIsAuthenticated = true;
            } catch (err) {
              this.logger.trace("authenticateTransaction.failed", err);
              this.deleteAccessTokenCookie(context.ctx);
              throw err;
            }
          }
        } else {
          throw new AuthenticationError("Authentication is required for this mutation. AccessToken missing.");
        }
      } else {
        if (context._transactionIsAuthenticated === true) {
          try {
            await this.authQueryHelper.unauthenticateTransaction(pgClient);
            context._transactionIsAuthenticated = false;
          } catch (err) {
            this.logger.trace("unauthenticateTransaction.failed", err);
            throw err;
          }
        }
      }
    }
  }

  private setAccessTokenCookie(ctx: any, loginData: ILoginData) {
    const cookieOptions = {
      ...this.authConfig.cookie,
      maxAge: loginData.tokenMeta.accessTokenMaxAgeInSeconds * 1000
    };

    ctx.cookies.set(this.authConfig.cookie.name, loginData.accessToken, cookieOptions);
  }

  private deleteAccessTokenCookie(ctx: any) {
    ctx.cookies.set(this.authConfig.cookie.name, null);
    ctx.cookies.set(`${this.authConfig.cookie.name}.sig`, null);
  }

  private async callAndHideErrorDetails(callback) {
    try {
      return await callback();
    } catch (error) {
      _.set(error, "extensions.hideDetails", true);
      throw error;
    }
  }

  private getResolvers(): ICustomResolverObject {
    return {
      "@fullstack-one/auth/Mutation/getUserIdentifier": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              const userIdentifierObject = await this.authConnector.findUser(pgClient, args.username, args.tenant || null);
              if (returnIdHandler.setReturnId(userIdentifierObject.userIdentifier)) {
                return "Token hidden due to returnId usage.";
              }
              return userIdentifierObject.userIdentifier;
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/login": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              const clientIdentifier = context.ctx.securityContext.clientIdentifier;

              const loginData = await this.authConnector.login(
                pgClient,
                args.authFactorProofTokens.map(returnIdHandler.getReturnId.bind(returnIdHandler)),
                clientIdentifier || null
              );

              if (context.ctx.securityContext.isBrowser === true) {
                this.setAccessTokenCookie(context.ctx, loginData);

                loginData.accessToken = null;
              }
              return loginData;
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/modifyAuthFactors": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              // tslint:disable-next-line:prettier
              await this.authConnector.modifyAuthFactors(
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
        };
      },
      "@fullstack-one/auth/Mutation/proofAuthFactor": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              await this.authConnector.proofAuthFactor(pgClient, returnIdHandler.getReturnId(args.authFactorProofToken));
              return true;
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/invalidateAccessToken": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              this.deleteAccessTokenCookie(context.ctx);
              await this.authConnector.invalidateAccessToken(pgClient, context.accessToken);
              return true;
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/invalidateAllAccessTokens": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              this.deleteAccessTokenCookie(context.ctx);
              await this.authConnector.invalidateAllAccessTokens(pgClient, context.accessToken);
              return true;
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/refreshAccessToken": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              const clientIdentifier = context.ctx.securityContext.clientIdentifier;

              const loginData = await this.authConnector.refreshAccessToken(
                pgClient,
                context.accessToken,
                clientIdentifier || null,
                args.refreshToken
              );

              if (context.ctx.securityContext.isBrowser === true) {
                this.setAccessTokenCookie(context.ctx, loginData);

                loginData.accessToken = null;
              }
              return loginData;
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/getTokenMeta": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;
              try {
                const tokenMeta = await this.authConnector.getTokenMeta(pgClient, context.accessToken);
                return tokenMeta;
              } catch (err) {
                this.deleteAccessTokenCookie(context.ctx);
                throw err;
              }
            });
          }
        };
      },
      "@fullstack-one/auth/Mutation/createUserAuthentication": (resolver) => {
        return {
          usesPgClientFromContext: true,
          resolver: async (obj, args, context, info, returnIdHandler: ReturnIdHandler) => {
            return this.callAndHideErrorDetails(async () => {
              const pgClient = context._transactionPgClient;

              const userAuthenticationId = await this.authConnector.createUserAuthentication(
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
                  await this.authQueryHelper.transaction(async (pgClientInternal) => {
                    const userAuthentication = await this.authConnector.getUserAuthenticationById(pgClientInternal, userAuthenticationId);
                    this.userRegistrationCallback(userAuthentication);
                  });
                }
              );
            });
          }
        };
      },
      "@fullstack-one/auth/Query/getUserAuthentication": (resolver) => {
        return {
          usesPgClientFromContext: false,
          resolver: async (obj, args, context, info) => {
            return this.callAndHideErrorDetails(async () => {
              return this.authQueryHelper.userTransaction(context.accessToken, async (pgClientInternal) => {
                return this.authConnector.getUserAuthentication(pgClientInternal, context.accessToken);
              });
            });
          }
        };
      }
    };
  }

  public registerUserRegistrationCallback(callback: (userAuthentication: IUserAuthentication) => void) {
    if (this.userRegistrationCallback != null) {
      throw new Error("Auth 'registerUserRegistrationCallback' can only be called once.");
    }
    this.userRegistrationCallback = callback;
  }

  public createAuthProvider(providerName: string, authFactorProofTokenMaxAgeInSeconds: number = null): AuthProvider {
    return new AuthProvider(
      providerName,
      this.authConnector,
      this.authQueryHelper,
      this.signHelper,
      this.loggerFactory.create(`${this.constructor.name}.AuthProvider.${providerName}`),
      this.authConfig,
      authFactorProofTokenMaxAgeInSeconds
    );
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    return this.authQueryHelper;
  }
}
