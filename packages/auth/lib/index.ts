import { Service, Inject, Container } from '@fullstack-one/di';
import { DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';
import { SchemaBuilder } from '@fullstack-one/schema-builder';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';

import { createConfig, hashByMeta, newHash, sha256 } from './crypto';
import { signJwt, verifyJwt, getProviderSignature, getAdminSignature } from './signHelper';
import * as passport from 'koa-passport';
import { LocalStrategy } from 'passport-local';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as koaSession from 'koa-session';
import * as koaCors from '@koa/cors';
import oAuthCallback from './oAuthCallback';
import { setDirectiveParser } from './migrationHelper';
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';

import * as fs from 'fs';

const schema = fs.readFileSync(require.resolve('../schema.gql'), 'utf-8');

// export
export * from './signHelper';

@Service()
export class Auth {

  private readonly sodiumConfig;
  private authConfig;
  private notificationFunction;

  private dbData = {
    schema: null,
    table: null,
    username: null,
    password: null,
    tenant: null
  };

  // DI
  private dbGeneralPool: DbGeneralPool;
  private logger: ILogger;
  private server: Server;
  private graphQl: GraphQl;
  private schemaBuilder: SchemaBuilder;

  constructor(
    @Inject(type => DbGeneralPool) dbGeneralPool?,
    @Inject(type => Server) server?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => SchemaBuilder) schemaBuilder?,
    @Inject(type => Config) config?,
    @Inject(type => GraphQl) graphQl?,
    @Inject(type => LoggerFactory) loggerFactory?: LoggerFactory
  ) {

    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.logger = loggerFactory.create('Auth');

    // DI
    this.server = server;
    this.dbGeneralPool = dbGeneralPool;
    this.graphQl = graphQl;
    this.schemaBuilder = schemaBuilder;

    this.authConfig = config.getConfig('auth');
    this.sodiumConfig = createConfig(this.authConfig.sodium);

    this.notificationFunction = async (user, caller: string, meta: string) => {
      throw new Error('No notification function has been defined.');
    };

    graphQl.addHook('preQuery', this.preQueryHook.bind(this));
    graphQl.addHook('preMutationCommit', this.preMutationCommitHook.bind(this));

    this.addMiddleware();

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));

    this.schemaBuilder.extendSchema(schema);

    this.graphQl.addResolvers(this.getResolvers());

    // add migration path
    this.schemaBuilder.getDbSchemaBuilder().addMigrationPath(__dirname + '/..');

    // register directive parser
    // require('./migrationHelper');

    // register Auth migration directive parser
    setDirectiveParser(this.schemaBuilder.registerDirectiveParser);

    // this.linkPassport();
  }

  public setNotificationFunction (notificationFunction) {
    if (notificationFunction == null || typeof notificationFunction !== 'function') {
      throw new Error('The notification function needs to be an async function.');
    }
    this.notificationFunction = notificationFunction;
  }

  public async setUser(client, accessToken) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    try {
      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.set_user_token($1, $2, $3, $4)', values);

      return true;
    } catch (err) {
      this.logger.warn('setUser.error', err);
      throw err;
    }
  }

  public async setAdmin(client) {
    try {
      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);
      return client;
    } catch (err) {
      this.logger.warn('setAdmin.error', err);
      throw err;
    }
  }

  public async register(username, tenant, meta) {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const result = await client.query('SELECT _meta.register_user($1, $2) AS payload', [username, tenant]);
      const payload = result.rows[0].payload;

      const user = {
        userId: payload.userId,
        payload,
        username,
        tenant,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
      };

      await this.notificationFunction(user, 'REGISTER', meta);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('register.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async initalizeUser(client, userId) {
    try {
      await this.setAdmin(client);

      const result = await client.query('SELECT _meta.initialize_user($1) AS payload', [userId]);
      const payload = result.rows[0].payload;

      const user = {
        userId: payload.userId,
        payload,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
      };

      return user;
    } catch (err) {
      this.logger.warn('initializeUser.error', err);
      throw err;
    }
  }

  public async login(username, tenant, password, authToken, clientIdentifier) {

    let authTokenPayload: any = {};
    let provider = 'local';

    if (authToken != null) {
      try {
        authTokenPayload = verifyJwt(this.authConfig.authToken, authToken);
        provider = authTokenPayload.providerName;
      } catch (err) {
        throw new Error('Failed to verify auth-token.');
      }
    }

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const metaResult = await client.query('SELECT _meta.get_user_pw_meta($1, $2, $3) AS data', [username, provider, tenant]);
      const data = metaResult.rows[0].data;

      let uid = data.userId;
      let pw = password;
      if (authToken != null) {
        uid = authTokenPayload.profileId;
        pw = authTokenPayload.providerName;
      }
      const providerSignature = getProviderSignature(this.authConfig.secrets.admin, provider, uid);

      const pwData: any = await hashByMeta(pw + providerSignature, data.pwMeta);

      await this.setAdmin(client);

      const loginResult = await client.query('SELECT _meta.login($1, $2, $3, $4) AS payload', [data.userId, provider, pwData.hash, clientIdentifier]);
      const payload = loginResult.rows[0].payload;

      const ret = {
        userId: data.userId,
        payload,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds),
        refreshToken: null
      };

      if (payload.refreshToken != null) {
        const refreshTokenPayload = {
          token: payload.refreshToken
        };
        ret.refreshToken = signJwt(this.authConfig.secrets.jwtRefreshToken, refreshTokenPayload, payload.userTokenMaxAgeInSeconds);
      }

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('login.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async refreshUserToken(accessToken, refreshTokenJwt, clientIdentifier) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);
    const refreshToken = verifyJwt(this.authConfig.secrets.jwtRefreshToken, refreshTokenJwt).token;

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, clientIdentifier, refreshToken];

      const result = await client.query('SELECT _meta.refresh_user_token($1, $2, $3, $4, $5, $6) AS payload', values);

      const newPayload = result.rows[0].payload;

      const ret = {
        userId: newPayload.userId,
        payload: newPayload,
        accessToken: signJwt(this.authConfig.secrets.jwt, newPayload, newPayload.userTokenMaxAgeInSeconds),
        refreshToken: null
      };

      if (newPayload.refreshToken != null) {
        const refreshTokenPayload = {
          token: newPayload.refreshToken
        };
        ret.refreshToken = signJwt(this.authConfig.secrets.jwtRefreshToken, refreshTokenPayload, newPayload.userTokenMaxAgeInSeconds);
      }

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('refreshUserToken.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async setPassword(accessToken, provider, password, userIdentifier) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);
    const uid = userIdentifier || payload.userId;
    const providerSignature = getProviderSignature(this.authConfig.secrets.admin, provider, uid);
    const pwData: any = await newHash(password + providerSignature, this.sodiumConfig);

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider, pwData.hash, JSON.stringify(pwData.meta)];

      await this.setAdmin(client);

      await client.query('SELECT _meta.set_password($1, $2, $3, $4, $5, $6, $7) AS payload', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('setPassword.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async forgotPassword(username, tenant, meta) {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const result = await client.query('SELECT _meta.forgot_password($1, $2) AS data', [username, tenant]);
      const payload = result.rows[0].data;

      const user = {
        userId: payload.userId,
        payload,
        username,
        tenant,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
      };

      await this.notificationFunction(user, 'FORGOT_PASSWORD', meta);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('forgotPassword.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async removeProvider(accessToken, provider) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider];

      await client.query('SELECT _meta.remove_provider($1, $2, $3, $4, $5) AS data', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('removeProvider.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async getTokenMeta(accessToken, tempSecret = false, tempTime = false) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, tempSecret, tempTime];

      const result = await client.query('SELECT _meta.is_user_token_valid($1, $2, $3, $4, $5, $6) AS data', values);
      const isValid = result.rows[0].data === true;

      const ret = {
        isValid,
        userId: payload.userId,
        provider: payload.provider,
        timestamp: payload.timestamp,
        issuedAt: payload.iat,
        expiresAt: payload.exp
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('getTokenMeta.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async invalidateUserToken(accessToken) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.invalidate_user_token($1, $2, $3, $4) AS data', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('invalidateUserToken.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async invalidateAllUserTokens(accessToken) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.invalidate_all_user_tokens($1, $2, $3, $4) AS data', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('invalidateAllUserTokens.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public getPassport() {
    return passport;
  }

  /* DB HELPER START */
  public async createDbClientAdminTransaction(dbClient) {
    // Begin transaction
    await dbClient.query('BEGIN');
    const SECRET = this.authConfig.secrets.admin;
    await dbClient.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(SECRET)}'`);
    return dbClient;
  }

  public async createDbClientUserTransaction(dbClient, accessToken) {
    // Begin transaction
    await dbClient.query('BEGIN');
    // set user for dbClient
    await this.setUser(dbClient, accessToken);
    return dbClient;
  }

  public async getCurrentUserIdFromClient(dbClient) {
    return (await dbClient.query('SELECT _meta.current_user_id();')).rows[0].current_user_id;
  }

  public async getCurrentUserIdFromAccessToken(accessToken) {
    const client = await this.dbGeneralPool.pgPool.connect();
    // set user for dbClient
    await this.setUser(client, accessToken);
    // get user ID from DB Client
    let userId = null;
    try {
      userId = await this.getCurrentUserIdFromClient(client);
    } catch { /*ignore error, return empty userId */ }
    // Release pgClient to pool
    await client.release();
    return userId;
  }

  public async adminTransaction(callback): Promise<any> {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      const ret = await callback(client);

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('adminTransaction.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async adminQuery(...queryArguments: any[]): Promise<any> {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setAdmin(client);

      // run query
      const result = await client.query.apply(client, queryArguments);

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('adminQuery.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async userTransaction(accessToken, callback): Promise<any> {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setUser(client, accessToken);

      const ret = await callback(client);

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('userTransaction.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async userQuery(accessToken, ...queryArguments: any[]): Promise<any> {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setUser(client, accessToken);

      const result = await client.query.apply(client, queryArguments);

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('userQuery.error', err);
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  /* DB HELPER END */

  private addMiddleware() {
    const app = this.server.getApp();

    // If app.proxy === true koa will respect x-forwarded headers
    app.proxy = this.authConfig.isServerBehindProxy === true ? true : false;

    // Prevent CSRF
    app.use(async (ctx, next) => {
      ctx.securityContext = {
        isBrowser: true,
        isApiClient: false,
        clientIdentifier: null,
        sameOriginApproved: {
          byReferrer: false,
          byOrigin: false,
          byHost: false
        }
      };

      // Generate clientIdentifier for refresh-token
      if (ctx.request.ip != null && ctx.request.headers['user-agent'] != null) {
        ctx.securityContext.clientIdentifier = sha256(`${ctx.request.ip}_#_${ctx.request.headers['user-agent']}`);
      }

      // Check if https is used on production
      if (process.env.NODE_ENV === 'production') {
        if (this.authConfig.enforceHttpsOnProduction !== false && ctx.request.protocol !== 'https') {
          return ctx.throw(400, 'Unsecure requests are not allowed here. Please use HTTPS.');
        }
      } else {
        if (this.authConfig.allowAllCorsOriginsOnDev === true) {
          return next();
        }
      }

      const origin = ctx.request.get('origin');
      const referrer = ctx.request.get('referrer');
      const host = ctx.request.get('host');

      // Validate same origin policy
      if (ctx.request.origin != null && this.authConfig.validOrigins.includes(ctx.request.origin)) {
        if (referrer.startsWith(ctx.request.origin + '/') || referrer === ctx.request.origin) {
          ctx.securityContext.sameOriginApproved.byReferrer = true;
        }
        if (origin === ctx.request.origin) {
          ctx.securityContext.sameOriginApproved.byOrigin = true;
        }
        if (host === ctx.request.host) {
          ctx.securityContext.sameOriginApproved.byHost = true;
        }
      }

      // If the client is no Browser we don't need to worry about cors.
      if (origin === this.authConfig.apiClientOrigin) {
        ctx.securityContext.isApiClient = true;
        ctx.securityContext.isBrowser = false;
      }

      if (ctx.securityContext.isBrowser === true) {
        if (ctx.securityContext.sameOriginApproved.byOrigin === true &&
            ctx.securityContext.sameOriginApproved.byReferrer === true &&
            ctx.securityContext.sameOriginApproved.byHost === true) {
          return next();
        }
        if (ctx.request.method === 'GET') {
          if (ctx.securityContext.sameOriginApproved.byHost === true) {
            return next();
          }
          if (ctx.securityContext.sameOriginApproved.byOrigin === true &&
              ctx.securityContext.sameOriginApproved.byReferrer === true) {
            return next();
          }
        }
      } else {
        return next();
      }

      return ctx.throw(400, 'Origin of the request is not allowed.');
    });

    const corsOptions = Object.assign({}, this.authConfig.corsOptions, {
      origin: (ctx) => {
        if (process.env.NODE_ENV === 'production') {
          return ctx.request.origin;
        }
        if (this.authConfig.allowAllCorsOriginsOnDev === true) {
          return '*';
        }
        return ctx.request.origin;
      }
    });

    app.use(koaCors(corsOptions));

    // Parse AccessToken
    app.use(async (ctx, next) => {
      // Token transfer over auhorization header and query parameter is not allowed for browsers.
      if (ctx.securityContext.isApiClient === true) {
        if (this.authConfig.tokenQueryParameter != null && ctx.request.query[this.authConfig.tokenQueryParameter] != null) {
          ctx.state.accessToken = ctx.request.query[this.authConfig.tokenQueryParameter];
          return next();
        }
        if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith('Bearer ')) {
          ctx.state.accessToken = ctx.request.header.authorization.slice(7);
          return next();
        }
      }

      const accessToken = ctx.cookies.get(this.authConfig.cookie.name, this.authConfig.cookie);

      if (accessToken != null) {
        ctx.state.accessToken = accessToken;
      }

      return next();
    });
  }

  private findAuthTableAndFields(dbMeta) {
     Object.keys(dbMeta.schemas).forEach((schemaName) => {
      const schemaObject = dbMeta.schemas[schemaName];
      Object.keys(schemaObject.tables).forEach((tableName) => {
        const tableObject = schemaObject.tables[tableName];
        if (tableObject.isAuth === true) {
          this.dbData.table = tableObject.name;
          this.dbData.schema = tableObject.schemaName;
          Object.keys(tableObject.columns).forEach((columnName) => {
            const columnObject = tableObject.columns[columnName];
            if (columnObject.auth != null) {
              if (columnObject.auth.isUsername === true) {
                this.dbData.username = columnObject.name;
              }
              if (columnObject.auth.isPassword === true) {
                this.dbData.password = columnObject.name;
              }
              if (columnObject.auth.isTenant === true) {
                this.dbData.tenant = columnObject.name;
              }
            }
          });
          return;
        }
      });
    });
  }

  private async boot() {
    const dbMeta = this.schemaBuilder.getDbMeta();

    this.findAuthTableAndFields(dbMeta);

    const authRouter = new KoaRouter();

    const app = this.server.getApp();

    authRouter.use(koaBody());

    app.keys = [this.authConfig.secrets.cookie];
    authRouter.use(koaSession(this.authConfig.oAuth.cookie, app));

    authRouter.use(passport.initialize());

    authRouter.get('/auth/oAuthFailure', async (ctx) => {
      const message = {
        err: 'ERROR_AUTH',
        data: null
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.frontendOrigins);
    });

    authRouter.get('/auth/oAuthSuccess/:data', async (ctx) => {
      const message = {
          err: null,
          data: JSON.parse(ctx.params.data)
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.frontendOrigins);
    });

    Object.keys(this.authConfig.oAuth.providers).forEach((key) => {
      const provider = this.authConfig.oAuth.providers[key];
      const callbackPath = '/auth/oAuthCallback/' + key;
      const serverApiAddress = this.authConfig.oAuth.serverApiAddress;
      const callbackURL = serverApiAddress + callbackPath;
      const providerConfig = Object.assign({}, provider.config, { callbackURL });

      const providerOptions = Object.assign({ scope: ['email'] }, provider.options, { session: false });

      passport.use(new provider.strategy(providerConfig, async (accessToken, refreshToken, profile, cb) => {
        try {
          let email = profile.email || profile._json.email;
          if (email == null && profile.emails != null && profile.emails[0] != null && profile.emails[0].value != null) {
            email = profile.emails[0].value;
          }

          if (profile == null || email == null || profile.id == null) {
            throw new Error('Email or id is missing!');
          }
          const authTokenPayload = {
            providerName: provider.name,
            profileId: profile.id,
            email,
            tenant: provider.tenant || 'default',
            profile
          };

          const response = {
            authTokenPayload,
            authToken: signJwt(this.authConfig.secrets.authToken, authTokenPayload, this.authConfig.authToken.maxAgeInSeconds)
          };
          cb(null, response);
        } catch (err) {
          this.logger.warn('passport.strategylogin.error', err);
          cb(err);
        }
      }));

      authRouter.get('/auth/oAuth/' + key, passport.authenticate(provider.name, providerOptions));

      const errorCatcher = async (ctx, next) => {
        try {
          await next();
        } catch (err) {
          this.logger.warn('passport.oAuthFailure.error', err);
          ctx.redirect('/auth/oAuthFailure');
        }
      };

      // tslint:disable-next-line:max-line-length
      authRouter.get(callbackPath, errorCatcher, passport.authenticate(provider.name, { failureRedirect: '/auth/oAuthFailure', session: false }), (ctx) => {
        ctx.redirect('/auth/oAuthSuccess/' + encodeURIComponent(JSON.stringify(ctx.state.user)));
      });
    });

    app.use(authRouter.routes());
    app.use(authRouter.allowedMethods());
  }

  private async preQueryHook(client, context, authRequired) {
    if (authRequired === true && context.accessToken != null) {
      await this.setUser(client, context.accessToken);
    }
  }

  private async preMutationCommitHook(client, hookInfo) {
    const mutation = hookInfo.mutationQuery.mutation;

    if (mutation.type === 'CREATE' && mutation.returnType === this.dbData.table) {
      const args = hookInfo.args;
      const ctx = hookInfo.context.ctx;
      const { acceptedAtField, acceptedVersionField, headerName } = this.authConfig.privacy;
      const meta = ctx.request.header[this.authConfig.metaHeaderName.toLowerCase()] || null;

      if (this.authConfig.privacy.active === true) {
        let tokenPayload;
        if (args.input[acceptedAtField] == null || args.input[acceptedVersionField] == null) {
          throw new Error(`The privacy-fields ('${acceptedAtField}', '${acceptedVersionField}') are required for creating a user.`);
        }
        if (ctx.request.header[headerName.toLowerCase()] == null) {
          throw new Error(`Missing privacy token header. '${headerName}'`);
        }
        try {
          tokenPayload = verifyJwt(this.authConfig.secrets.privacyToken, ctx.request.header[headerName.toLowerCase()]);
        } catch (e) {
          throw new Error('Failed to verify privacy token.');
        }
        if (tokenPayload.acceptedAt !== args.input[acceptedAtField] || tokenPayload.acceptedVersion !== args.input[acceptedVersionField]) {
          throw new Error(`The privacy-fields ('${acceptedAtField}', '${acceptedVersionField}') must match the payload of the privacy-token.`);
        }
      }

      const authTokenHeaderName = this.authConfig.authToken.headerName.toLowerCase();

      const user = await this.initalizeUser(client, hookInfo.entityId);

      const notificationContext = {
        user,
        input: args.input,
        tokenPayload: null
      };

      if (ctx.request.header[authTokenHeaderName] != null) {
        let tokenPayload;

        try {
          tokenPayload = verifyJwt(this.authConfig.secrets.authToken, ctx.request.header[authTokenHeaderName]);
        } catch (e) {
          throw new Error('Failed to verify auth-token.');
        }

        if (tokenPayload.email !== user.payload.username) {
          throw new Error(`The authToken email does not match username.`);
        }

        notificationContext.tokenPayload = tokenPayload;

        await this.setPassword(user.accessToken, user.payload.provider, tokenPayload.providerName, tokenPayload.profileId);

        await this.notificationFunction('REGISTER_OAUTH', notificationContext);
      } else {
        await this.notificationFunction('REGISTER', notificationContext);
      }
    }
  }

  private createPrivacyToken(acceptedVersion) {
    if (acceptedVersion !== this.authConfig.privacy.versionToApprove) {
      throw new Error(`The approved version is not version '${this.authConfig.privacy.versionToApprove}'.`);
    }

    const currentDate = new Date();
    const acceptedAt = currentDate.toString();

    const payload = {
      acceptedVersion,
      acceptedAt
    };

    const privacyToken = signJwt(this.authConfig.secrets.privacyToken, payload, this.authConfig.privacy.tokenMaxAgeInSeconds);

    return {
      privacyToken,
      acceptedVersion,
      acceptedAt
    };
  }

  private getResolvers() {
    return {
      '@fullstack-one/auth/register': async (obj, args, context, info, params) => {
        return await this.register(args.username, args.tenant || 'default', args.meta || null);
      },
      '@fullstack-one/auth/login': async (obj, args, context, info, params) => {
        const clientIdentifier = context.ctx.securityContext.clientIdentifier;
        const lData = await this.login(args.username, args.tenant || 'default', args.password, args.authToken, clientIdentifier);
        if (context.ctx.securityContext.isBrowser === true) {
          context.ctx.cookies.set(this.authConfig.cookie.name, lData.accessToken, this.authConfig.cookie);
          return {
            userId: lData.userId,
            refreshToken: lData.refreshToken || null,
            sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
          };
        } else {
          return Object.assign({}, lData, {
            sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
          });
        }
      },
      '@fullstack-one/auth/forgotPassword': async (obj, args, context, info, params) => {
        return await this.forgotPassword(args.username, args.tenant || 'default', args.meta || null);
      },
      '@fullstack-one/auth/setPassword': async (obj, args, context, info, params) => {
        const accessToken = args.accessToken || context.accessToken;
        return await this.setPassword(accessToken, 'local', args.password, null);
      },
      '@fullstack-one/auth/getTokenMeta': async (obj, args, context, info, params) => {
        const accessToken = args.accessToken || context.accessToken;
        const tempToken = args.tempToken || false;
        const tempTokenExpiration = args.tempTokenExpiration || false;
        return await this.getTokenMeta(accessToken, tempToken, tempTokenExpiration);
      },
      '@fullstack-one/auth/invalidateUserToken': async (obj, args, context, info, params) => {
        const accessToken = context.accessToken;
        context.ctx.cookies.set(this.authConfig.cookie.name, null);
        return await this.invalidateUserToken(accessToken);
      },
      '@fullstack-one/auth/invalidateAllUserTokens': async (obj, args, context, info, params) => {
        const accessToken = context.accessToken;
        context.ctx.cookies.set(this.authConfig.cookie.name, null);
        return await this.invalidateAllUserTokens(accessToken);
      },
      '@fullstack-one/auth/refreshUserToken': async (obj, args, context, info, params) => {
        const clientIdentifier = context.ctx.securityContext.clientIdentifier;
        const accessToken = context.accessToken;
        const lData = await this.refreshUserToken(accessToken, args.refreshToken, clientIdentifier);

        if (context.ctx.securityContext.isBrowser === true) {
          context.ctx.cookies.set(this.authConfig.cookie.name, lData.accessToken, this.authConfig.cookie);
          return {
            userId: lData.userId,
            refreshToken: lData.refreshToken || null,
            sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
          };
        } else {
          return Object.assign({}, lData, {
            sessionExpirationTimestamp: lData.payload.timestamp + (lData.payload.userTokenMaxAgeInSeconds * 1000)
          });
        }
      },
      '@fullstack-one/auth/createPrivacyToken': async (obj, args, context, info, params) => {
        return this.createPrivacyToken(args.acceptedVersion);
      }
    };
  }
}
