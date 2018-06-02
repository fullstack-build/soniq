import { Service, Inject, Container } from '@fullstack-one/di';
import { DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';
import { SchemaBuilder } from '@fullstack-one/schema-builder';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';

import { createConfig, hashByMeta, newHash } from './crypto';
import { signJwt, verifyJwt, getProviderSignature, getAdminSignature } from './signHelper';
import * as passport from 'koa-passport';
import { LocalStrategy } from 'passport-local';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as koaSession from 'koa-session';
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

  public async loginOrRegister(username, tenant, provider, password, userIdentifier) {
    if (provider === 'local') {
      throw new Error('This method is not allowed for local provider.');
    }

    let lData;
    try {
      lData = await this.login(username, tenant, provider, password, userIdentifier);
      return lData;
    // tslint:disable-next-line:no-empty
    } catch (err) {}

    try {
      lData = await this.register(username, tenant, null);

      await this.setPassword(lData.accessToken, provider, password, userIdentifier);

      lData = await this.login(username, tenant, provider, password, userIdentifier);

      return lData;
    } catch (err) {
      this.logger.warn('loginOrRegister.error', err);
      throw new Error('User does exist or password is invalid.');
    }
  }

  public async register(username, tenant, meta) {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

  public async login(username, tenant, provider, password, userIdentifier) {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

      const metaResult = await client.query('SELECT _meta.get_user_pw_meta($1, $2, $3) AS data', [username, provider, tenant]);
      const data = metaResult.rows[0].data;

      const uid = userIdentifier || data.userId;
      const providerSignature = getProviderSignature(this.authConfig.secrets.admin, provider, uid);

      const pwData: any = await hashByMeta(password + providerSignature, data.pwMeta);

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

      const loginResult = await client.query('SELECT _meta.login($1, $2, $3) AS payload', [data.userId, provider, pwData.hash]);
      const payload = loginResult.rows[0].payload;

      const ret = {
        userId: data.userId,
        payload,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
      };

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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

  public async isTokenValid(accessToken, tempSecret = false, tempTime = false) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, tempSecret, tempTime];

      const result = await client.query('SELECT _meta.is_user_token_valid($1, $2, $3, $4, $5, $6) AS data', values);
      const isValid = result.rows[0].data === true;

      await client.query('COMMIT');
      return isValid;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.warn('isTokenValid.error', err);
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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

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

    app.use(async (ctx, next) => {
      if (this.authConfig.tokenQueryParameter != null && ctx.request.query[this.authConfig.tokenQueryParameter] != null) {
        ctx.state.accessToken = ctx.request.query[this.authConfig.tokenQueryParameter];
        return next();
      }
      if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith('Bearer ')) {
        ctx.state.accessToken = ctx.request.header.authorization.slice(7);
        return next();
      }

      const accessToken = ctx.cookies.get(this.authConfig.cookie.name, this.authConfig.cookie);

      if (accessToken != null) {
        ctx.state.accessToken = accessToken;
      }

      return next();
    });
  }

  private async boot() {
    const authRouter = new KoaRouter();

    const app = this.server.getApp();

    authRouter.get('/test', async (ctx) => {
      ctx.body = 'Hallo';
    });

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

          const lData = await this.loginOrRegister(email, provider.tenant || 'default', provider.name, provider.name, profile.id);
          cb(null, lData);
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

  private getResolvers() {
    return {
      '@fullstack-one/auth/register': async (obj, args, context, info, params) => {
        return await this.register(args.username, args.tenant || 'default', args.meta || null);
      },
      '@fullstack-one/auth/login': async (obj, args, context, info, params) => {
        return await this.login(args.username, args.tenant || 'default', 'local', args.password, null);
      },
      '@fullstack-one/auth/forgotPassword': async (obj, args, context, info, params) => {
        return await this.forgotPassword(args.username, args.tenant || 'default', args.meta || null);
      },
      '@fullstack-one/auth/setPassword': async (obj, args, context, info, params) => {
        return await this.setPassword(args.accessToken, 'local', args.password, null);
      },
      '@fullstack-one/auth/isUserTokenValid': async (obj, args, context, info, params) => {
        return await this.isTokenValid(args.accessToken, false, false);
      },
      '@fullstack-one/auth/invalidateUserToken': async (obj, args, context, info, params) => {
        context.ctx.cookies.set(this.authConfig.cookie.name, null);
        return await this.invalidateUserToken(args.accessToken);
      },
      '@fullstack-one/auth/invalidateAllUserTokens': async (obj, args, context, info, params) => {
        context.ctx.cookies.set(this.authConfig.cookie.name, null);
        return await this.invalidateAllUserTokens(args.accessToken);
      },
      '@fullstack-one/auth/setCookie': async (obj, args, context, info, params) => {
        const tokenValid = await this.isTokenValid(args.accessToken, false, false);
        if (tokenValid === true) {
          context.ctx.cookies.set(this.authConfig.cookie.name, args.accessToken, this.authConfig.cookie);
          return true;
        }
        throw new Error(`Could not set token into the cookie. Maybe it's invalid or expired.`);
      },
      '@fullstack-one/auth/deleteCookie': async (obj, args, context, info, params) => {
        context.ctx.cookies.set(this.authConfig.cookie.name, null);
        return true;
      }
    };
  }
}
