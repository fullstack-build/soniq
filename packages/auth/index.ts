import * as F1 from '../core';

import { createConfig, hashByMeta, newHash } from './crypto';
import { signJwt, verifyJwt, getProviderSignature, getAdminSignature } from './sign';

export class Auth extends F1.AbstractPackage {
  private sodiumConfig;
  private authConfig;

  constructor() {
    super();

    this.authConfig = this.$one.getConfig('auth');
    this.sodiumConfig = createConfig(this.authConfig.sodium);
  }

  public async register(username, tenant) {
    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const rows = await client.query('SELECT _meta.register_user($1, $2, $3) AS payload', [username, tenant]);
      const payload = rows[0].payload;

      const ret = {
        userId: payload.userId,
        payload,
        token: signJwt(payload, payload.userTokenMaxAgeInSeconds)
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

      const metaRows = await client.query('SELECT _meta.get_user_pw_meta($1, $2, $3) AS data', [username, provider, tenant]);
      const data = metaRows[0].data;

      const uid = userIdentifier || data.userId;
      const providerSignature = getProviderSignature(provider, uid);

      const pwData: any = await hashByMeta(password + providerSignature, data.pwMeta);

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      const loginRows = await client.query('SELECT _meta.login($1, $2, $3) AS payload', [data.userId, provider, pwData.hash]);
      const payload = loginRows[0].payload;

      const ret = {
        userId: data.userId,
        payload,
        token: signJwt(payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async setPassword(token, provider, password, userIdentifier) {
    const payload = verifyJwt(token);
    const uid = userIdentifier || payload.userId;
    const providerSignature = getProviderSignature(provider, uid);
    const pwData: any = await newHash(password + providerSignature, this.sodiumConfig);

    const pool = this.$one.getDbPool();

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      const values = [payload.userId, payload.userToken, payload.provider, payload.timestamp, provider, pwData.hash, pwData.meta];

      await client.query(`SET LOCAL auth.admin_token TO '${getAdminSignature()}'`);

      await client.query('SELECT _meta.set_password($1, $2, $3, $4, $5, $6, $7, $8) AS payload', values);

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

      const rows = await client.query('SELECT _meta.forgot_password($1, $2) AS data', [username, tenant]);
      const payload = rows[0].data;

      const ret = {
        userId: payload.userId,
        payload,
        token: signJwt(payload, payload.userTokenMaxAgeInSeconds)
      };

      await client.query('COMMIT');
      return ret;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  public async removeProvider(token, provider) {
    const payload = verifyJwt(token);
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

  public async invalidateUserToken(token) {
    const payload = verifyJwt(token);
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

  public async invalidateAllUserTokens(token) {
    const payload = verifyJwt(token);
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
}
