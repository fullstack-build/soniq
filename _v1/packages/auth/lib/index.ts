import * as fs from "fs";
import * as koaCors from "@koa/cors";
import { Service, Inject } from "@fullstack-one/di";
import { ORM, PostgresQueryRunner } from "@fullstack-one/db";
import { Server } from "@fullstack-one/server";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { Config } from "@fullstack-one/config";
import { GraphQl, ReturnIdHandler, RevertibleResult, UserInputError, AuthenticationError } from "@fullstack-one/graphql";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";

import migrations from "./migrations";
import { CSRFProtection } from "./CSRFProtection";
import { AuthConnector } from "./AuthConnector";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { AccessTokenParser } from "./AccessTokenParser";
import { AuthProvider } from "./AuthProvider";
import { IAuthFactorForProof, IUserAuthentication, ILoginData } from "./interfaces";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import * as _ from "lodash";

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
  private orm: ORM;

  // DI
  private logger: ILogger;
  private loggerFactory: LoggerFactory;
  private userRegistrationCallback: (userAuthentication: IUserAuthentication) => void;

  public readonly authConnector: AuthConnector;

  constructor(
    @Inject((type) => ORM) orm: ORM,
    @Inject((type) => Server) server,
    @Inject((type) => SchemaBuilder) schemaBuilder,
    @Inject((type) => Config) config,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory
  ) {
    // register package config
    this.authConfig = config.registerConfig("Auth", `${__dirname}/../config`);

    orm.addMigrations(migrations);

    this.loggerFactory = loggerFactory;
    this.logger = loggerFactory.create(this.constructor.name);

    this.cryptoFactory = new CryptoFactory(this.authConfig.secrets.encryptionKey, this.authConfig.crypto.algorithm);
    this.signHelper = new SignHelper(this.authConfig.secrets.admin, this.cryptoFactory);

    this.authQueryHelper = new AuthQueryHelper(orm, this.logger, this.cryptoFactory, this.signHelper);
    this.authConnector = new AuthConnector(this.authQueryHelper, this.logger, this.cryptoFactory, this.authConfig);
    this.csrfProtection = new CSRFProtection(this.logger, this.authConfig);
    this.accessTokenParser = new AccessTokenParser(this.authConfig);
    this.orm = orm;

    graphQl.addPreQueryHook(this.preQueryHook.bind(this));

    schemaBuilder.extendSchema(schema);

    graphQl.addResolvers(this.getResolvers());

    this.addMiddleware(server);
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

  private async preQueryHook(queryRunner: PostgresQueryRunner, context, authRequired: boolean, buildObject) {
    // If the current request is a query (not a mutation)
    if (context._isRequestGqlQuery === true) {
      if (authRequired === true) {
        if (context.accessToken != null) {
          try {
            await this.authQueryHelper.authenticateTransaction(queryRunner, context.accessToken);
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
              await this.authQueryHelper.authenticateTransaction(queryRunner, context.accessToken);
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
            await this.authQueryHelper.unauthenticateTransaction(queryRunner);
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

  private getResolvers() {
    return {
      "@fullstack-one/auth/getUserIdentifier": async (obj, args, context, info, params, returnIdHandler: ReturnIdHandler) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          const userIdentifierObject = await this.authConnector.findUser(queryRunner, args.username, args.tenant || null);
          if (returnIdHandler.setReturnId(userIdentifierObject.userIdentifier)) {
            return "Token hidden due to returnId usage.";
          }
          return userIdentifierObject.userIdentifier;
        });
      },
      "@fullstack-one/auth/login": async (obj, args, context, info, params, returnIdHandler: ReturnIdHandler) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          const clientIdentifier = context.ctx.securityContext.clientIdentifier;

          const loginData = await this.authConnector.login(
            queryRunner,
            args.authFactorProofTokens.map(returnIdHandler.getReturnId.bind(returnIdHandler)),
            clientIdentifier || null
          );

          if (context.ctx.securityContext.isBrowser === true) {
            this.setAccessTokenCookie(context.ctx, loginData);

            loginData.accessToken = null;
          }
          return loginData;
        });
      },
      "@fullstack-one/auth/modifyAuthFactors": async (obj, args, context, info, params, returnIdHandler: ReturnIdHandler) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          // tslint:disable-next-line:prettier
          await this.authConnector.modifyAuthFactors(
            queryRunner,
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
      "@fullstack-one/auth/proofAuthFactor": async (obj, args, context, info, params, returnIdHandler: ReturnIdHandler) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          await this.authConnector.proofAuthFactor(queryRunner, returnIdHandler.getReturnId(args.authFactorProofToken));
          return true;
        });
      },
      "@fullstack-one/auth/invalidateAccessToken": async (obj, args, context, info, params) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          this.deleteAccessTokenCookie(context.ctx);
          await this.authConnector.invalidateAccessToken(queryRunner, context.accessToken);
          return true;
        });
      },
      "@fullstack-one/auth/invalidateAllAccessTokens": async (obj, args, context, info, params) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          this.deleteAccessTokenCookie(context.ctx);
          await this.authConnector.invalidateAllAccessTokens(queryRunner, context.accessToken);
          return true;
        });
      },
      "@fullstack-one/auth/refreshAccessToken": async (obj, args, context, info, params) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          const clientIdentifier = context.ctx.securityContext.clientIdentifier;

          const loginData = await this.authConnector.refreshAccessToken(
            queryRunner,
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
      },
      "@fullstack-one/auth/getTokenMeta": async (obj, args, context, info, params) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;
          try {
            const tokenMeta = await this.authConnector.getTokenMeta(queryRunner, context.accessToken);
            return tokenMeta;
          } catch (err) {
            this.deleteAccessTokenCookie(context.ctx);
            throw err;
          }
        });
      },
      "@fullstack-one/auth/createUserAuthentication": async (obj, args, context, info, params, returnIdHandler: ReturnIdHandler) => {
        return this.callAndHideErrorDetails(async () => {
          const queryRunner = context._transactionQueryRunner;

          const userAuthenticationId = await this.authConnector.createUserAuthentication(
            queryRunner,
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
              await this.authQueryHelper.transaction(async (queryRunnerInternal) => {
                const userAuthentication = await this.authConnector.getUserAuthenticationById(queryRunnerInternal, userAuthenticationId);
                this.userRegistrationCallback(userAuthentication);
              });
            }
          );
        });
      },
      "@fullstack-one/auth/getUserAuthentication": async (obj, args, context, info, params) => {
        return this.callAndHideErrorDetails(async () => {
          return this.authQueryHelper.userTransaction(context.accessToken, async (queryRunnerInternal) => {
            return this.authConnector.getUserAuthentication(queryRunnerInternal, context.accessToken);
          });
        });
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
      this.orm,
      this.loggerFactory.create(`${this.constructor.name}.AuthProvider.${providerName}`),
      this.authConfig,
      authFactorProofTokenMaxAgeInSeconds
    );
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    return this.authQueryHelper;
  }
}
