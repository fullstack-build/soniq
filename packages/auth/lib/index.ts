import { Service, Inject, Container } from '@fullstack-one/di';
import { DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';
import { Migration } from '@fullstack-one/migration';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';

import { createConfig, hashByMeta, newHash } from './crypto';
import { signJwt, verifyJwt, getProviderSignature, getAdminSignature } from './signHelper';
import * as passport from 'koa-passport';
import { LocalStrategy } from 'passport-local';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as koaSession from 'koa-session';
import oAuthCallback from './oAuthCallback';
// import { DbGeneralPool } from '@fullstack-one/db/DbGeneralPool';

// export
export * from './signHelper';

@Service()
export class Auth {

  private sodiumConfig;
  private authConfig;

  // DI
  private dbGeneralPool: DbGeneralPool;
  private server: Server;
  private graphQl: GraphQl;

  constructor(
    @Inject(type => DbGeneralPool) dbGeneralPool?,
    @Inject(type => Server) server?,
    @Inject(type => BootLoader) bootLoader?,
    @Inject(type => Migration) migration?,
    @Inject(type => Config) config?,
    @Inject(type => GraphQl) graphQl?
  ) {

    // register package config
    config.addConfigFolder(__dirname + '/../config');

    // DI
    this.server = server;
    this.dbGeneralPool = dbGeneralPool;
    this.graphQl = graphQl;

    this.authConfig = config.getConfig('auth');
    this.sodiumConfig = createConfig(this.authConfig.sodium);

    graphQl.addPreQueryHook(this.preQueryHook.bind(this));

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));

    // add migration path
    migration.addMigrationPath(__dirname + '/..');

    // register directive parser
    require('./migrationHelper');

    // this.linkPassport();
  }

  public async setUser(client, accessToken) {
    const payload = verifyJwt(this.authConfig.secrets.jwt, accessToken);

    try {
      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.set_user_token($1, $2, $3, $4)', values);

      return true;
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.log('Failed to SetUser', err);
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
      lData = await this.register(username, tenant);

      await this.setPassword(lData.accessToken, provider, password, userIdentifier);

      lData = await this.login(username, tenant, provider, password, userIdentifier);

      return lData;
    } catch (err) {
      throw new Error('User does exist or password is invalid.');
    }
  }

  public async register(username, tenant) {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

      const result = await client.query('SELECT _meta.register_user($1, $2) AS payload', [username, tenant]);
      const payload = result.rows[0].payload;

      const ret = {
        userId: payload.userId,
        payload,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
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
      // tslint:disable-next-line:no-console
      console.log(err);
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async forgotPassword(username, tenant) {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

      const result = await client.query('SELECT _meta.forgot_password($1, $2) AS data', [username, tenant]);
      const payload = result.rows[0].data;

      const ret = {
        userId: payload.userId,
        payload,
        accessToken: signJwt(this.authConfig.secrets.jwt, payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
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
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async adminQuery(): Promise<any> {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature(this.authConfig.secrets.admin)}'`);

      const ret = await client.query.call(arguments);

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
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
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  public async userQuery(accessToken): Promise<any> {

    const client = await this.dbGeneralPool.pgPool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await this.setUser(client, accessToken);

      // Put all function arguments to a new array
      const args = [...arguments];
      // Remove first argument because it's accessToken
      args.shift();

      const ret = await client.query.call(args);

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  }

  /* DB HELPER END */

  private addMiddleware(app) {

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

    this.addMiddleware(app);

    authRouter.get('/test', async (ctx) => {
      ctx.body = 'Hallo';
    });

    authRouter.use(koaBody());

    app.keys = [this.authConfig.secrets.cookie];
    authRouter.use(koaSession(this.authConfig.oAuth.cookie, app));

    authRouter.use(passport.initialize());
    // authRouter.use(passport.session());

    authRouter.post('/auth/invalidateAccessToken', async (ctx) => {
      let success;

      try {
        success = await this.invalidateUserToken(ctx.state.accessToken);
      } catch (err) {
        success = false;
        ctx.response.status = 400;
      }

      ctx.body = { success };
    });

    authRouter.post('/auth/invalidateAllAccessTokens', async (ctx) => {
      let success;

      try {
        success = await this.invalidateAllUserTokens(ctx.state.accessToken);
      } catch (err) {
        success = false;
        ctx.response.status = 400;
      }

      ctx.body = { success };
    });

    authRouter.post('/auth/register', async (ctx) => {
      if (ctx.request.body.username == null) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: '"username" is required.' };
        return;
      }

      try {
        const lData = await this.register(ctx.request.body.username, ctx.request.body.tenant || 'default');

        ctx.body = Object.assign({}, lData, { success: true });
      } catch (err) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: 'This user may already exist or another error occured.' };
      }
    });

    authRouter.post('/auth/local/login', async (ctx) => {
      if (ctx.request.body.username == null) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: '"username" is required.' };
        return;
      }

      if (ctx.request.body.password == null) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: '"password" is required.' };
        return;
      }

      try {
        const lData = await this.login(ctx.request.body.username, ctx.request.body.tenant || 'default', 'local', ctx.request.body.password, null);

        ctx.body = Object.assign({}, lData, { success: true });
      } catch (err) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: 'Invalid username, tenant or password.' };
      }
    });

    authRouter.get('/auth/isAccessTokenValid', async (ctx) => {
      try {
        const isValid = await this.isTokenValid(ctx.state.accessToken, false, false);
        ctx.body = { isValid };
      } catch (err) {
        ctx.response.status = 400;
        ctx.body = { isValid: false };
      }
    });

    authRouter.post('/auth/local/setPassword', async (ctx) => {
      if (ctx.request.body.password == null) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: '"password" is required.' };
        return;
      }

      try {
        const success = await this.setPassword(ctx.state.accessToken, 'local', ctx.request.body.password, null);
        ctx.body = { success };
      } catch (err) {
        ctx.response.status = 400;
        ctx.body = { success: false, error: 'Invalid token.' };
      }
    });

    authRouter.post('/auth/forgotPassword', async (ctx) => {
      try {
        const lData = await this.forgotPassword(ctx.request.body.username, ctx.request.body.tenant || 'default');

        ctx.body = Object.assign({}, lData, { success: true });
      } catch (err) {
        ctx.body = { success: false };
        ctx.response.status = 400;
      }
    });

    authRouter.post('/auth/forgotPassword', async (ctx) => {
      try {
        const lData = await this.forgotPassword(ctx.request.body.username, ctx.request.body.tenant || 'default');

        ctx.body = Object.assign({}, lData, { success: true });
      } catch (err) {
        ctx.body = { success: false };
        ctx.response.status = 400;
      }
    });

    authRouter.post('/auth/setCookie', async (ctx) => {
      try {
        ctx.cookies.set(this.authConfig.cookie.name, ctx.state.accessToken, this.authConfig.cookie);
        ctx.body = { success: true };
      } catch (e) {
        ctx.body = { success: false };
      }
    });

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
          cb(err);
        }
      }));

      authRouter.get('/auth/oAuth/' + key, passport.authenticate(provider.name, providerOptions));

      const errorCatcher = async (ctx, next) => {
        try {
          await next();
        } catch (err) {
          // tslint:disable-next-line:no-console
          console.error(err);
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

}
