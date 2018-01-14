import * as F1 from '../core';

import { createConfig, hashByMeta, newHash } from './crypto';
import { signJwt, verifyJwt, getProviderSignature, getAdminSignature, getCookieSecret } from './sign';
// tslint:disable-next-line:no-var-requires
const passport = require('koa-passport');
import { LocalStrategy } from 'passport-local';
import * as KoaRouter from 'koa-router';
import * as koaBody from 'koa-bodyparser';
import * as koaSession from 'koa-session';
import oAuthCallback from './oAuthCallback';

export class Auth extends F1.AbstractPackage {
  private sodiumConfig;
  private authConfig;

  constructor() {
    super();

    this.authConfig = this.$one.getConfig('auth');
    this.sodiumConfig = createConfig(this.authConfig.sodium);

    this.linkPassport();
  }

  public async setUser(client, accessToken) {
    const payload = verifyJwt(accessToken);

    try {
      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.set_user_token($1, $2, $3, $4)', values);

      return true;
    } catch (err) {
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

      lData = await this.setPassword(lData.token, provider, password, userIdentifier);
    } catch (err) {
      throw new Error('User does exist or password is invalid.');
    }
  }

  public async register(username, tenant) {
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const result = await client.query('SELECT _meta.register_user($1, $2, $3) AS payload', [username, tenant]);
      const payload = result.rows[0].payload;

      const ret = {
        userId: payload.userId,
        payload,
        accessToken: signJwt(payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async login(username, tenant, provider, password, userIdentifier) {
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const metaResult = await client.query('SELECT _meta.get_user_pw_meta($1, $2, $3) AS data', [username, provider, tenant]);
      const data = metaResult.rows[0].data;

      const uid = userIdentifier || data.userId;
      const providerSignature = getProviderSignature(provider, uid);

      const pwData: any = await hashByMeta(password + providerSignature, data.pwMeta);

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const loginResult = await client.query('SELECT _meta.login($1, $2, $3) AS payload', [data.userId, provider, pwData.hash]);
      const payload = loginResult.rows[0].payload;

      const ret = {
        userId: data.userId,
        payload,
        accessToken: signJwt(payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async setPassword(accessToken, provider, password, userIdentifier) {
    const payload = verifyJwt(accessToken);
    const uid = userIdentifier || payload.userId;
    const providerSignature = getProviderSignature(provider, uid);
    const pwData: any = await newHash(password + providerSignature, this.sodiumConfig);

    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider, pwData.hash, JSON.stringify(pwData.meta)];

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      await client.query('SELECT _meta.set_password($1, $2, $3, $4, $5, $6, $7) AS payload', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async forgotPassword(username, tenant) {
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const result = await client.query('SELECT _meta.forgot_password($1, $2) AS data', [username, tenant]);
      const payload = result.rows[0].data;

      const ret = {
        userId: payload.userId,
        payload,
        accessToken: signJwt(payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async removeProvider(accessToken, provider) {
    const payload = verifyJwt(accessToken);
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider];

      await client.query('SELECT _meta.remove_provider($1, $2, $3, $4, $5) AS data', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async isTokenValid(accessToken, tempSecret = false, tempTime = false) {
    const payload = verifyJwt(accessToken);
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, tempSecret, tempTime];

      const result = await client.query('SELECT _meta.is_user_token_valid($1, $2, $3, $4, $5, $6) AS data', values);
      const isValid = result.rows[0].data === true;

      await client.query('COMMIT');
      return isValid;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async invalidateUserToken(accessToken) {
    const payload = verifyJwt(accessToken);
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.invalidate_user_token($1, $2, $3, $4) AS data', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async invalidateAllUserTokens(accessToken) {
    const payload = verifyJwt(accessToken);
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp];

      await client.query('SELECT _meta.invalidate_all_user_tokens($1, $2, $3, $4) AS data', values);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public linkPassport() {
    const authRouter = new KoaRouter();

    authRouter.get('/test', async (ctx) => {
      ctx.body = 'Hallo';
    });

    authRouter.use(koaBody());

    this.$one.getApp().keys = [getCookieSecret()];
    authRouter.use(koaSession(this.authConfig.oAuth.cookie, this.$one.getApp()));

    authRouter.use(passport.initialize());
    authRouter.use(passport.session());

    this.$one.getApp().use(async (ctx, next) => {
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
        accessToken: null
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.origins);
    });

    authRouter.get('/auth/oAuthSuccess/:data', async (ctx) => {
      const message = {
        err: null,
        data: JSON.parse(ctx.params.data)
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.origins);
    });

    Object.keys(this.authConfig.oAuth.providers).forEach((key) => {
      const provider = this.authConfig.oAuth.providers[key];
      const callbackPath = '/auth/oAuthCallback/' + key;
      const serverApiAddress = this.authConfig.oAuth.serverApiAddress;
      const callbackURL = serverApiAddress + callbackPath;
      const providerConfig = Object.assign({}, provider.config, { callbackURL });

      passport.use(new provider.strategy(provider.config), async (accessToken, refreshToken, profile, cb) => {
        try {
          const lData = await this.loginOrRegister(profile.email, provider.tenant || 'default', provider.name, provider.name, profile.id);
          cb(null, lData);
        } catch (err) {
          cb(err);
        }
      });

      authRouter.get('/auth/oAuth/' + key, passport.authenticate(provider.name));

      authRouter.get(callbackPath, passport.authenticate(provider.name, { failureRedirect: '/auth/oAuthFailure' }), (ctx) => {
        ctx.redirect('/auth/oAuthSuccess/' + encodeURIComponent(JSON.stringify(ctx.state.user)));
      });
    });

    this.$one.getApp().use(authRouter.routes());
    this.$one.getApp().use(authRouter.allowedMethods());
  }

  public getPassport() {
    return passport;
  }
}
