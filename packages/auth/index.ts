import * as F1 from '../core';
import securePassword from 'secure-password';

export class Auth extends F1.AbstractPackage {
  private pwd;

  constructor() {
    super();

    this.pwd = securePassword(this.$one.getConfig('securePassword'));
  }

  /*public async register(username, password, tenant) {
    const pool = this.$one.getDbPool();

    const hash = await this.pwdHash(password);

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      const userId = await client.query('SELECT _meta.registerUser($1, $2, $3)', [username, hash, tenant]);

      await client.query('COMMIT');
      return userId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }*/

  public async login(username, password, tenant) {
    const pool = this.$one.getDbPool();

    const hash = await this.pwdHash(password);

    const client = await pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      const userId = await client.query('SELECT _meta.registerUser($1, $2, $3)', [username, hash, tenant]);

      await client.query('COMMIT');
      return userId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  private pwdHash(password) {
    return new Promise((resolve, reject) => {
      const passwordBuffer = Buffer.from(password);
      this.pwd.hash(passwordBuffer, (err, hash) => {
        if (err) {
          return reject(err);
        }
        resolve(hash.toString('hex'));
      });
    });
  }

  private pwdVerify(password, hash) {
    return new Promise((resolve, reject) => {

      const passwordBuffer = Buffer.from(password);
      const hashBuffer = Buffer.from(password, 'hex');

      this.pwd.verify(passwordBuffer, hash, (err, result) => {
        if (err) {
          return reject(err);
        }

        if (result === securePassword.INVALID_UNRECOGNIZED_HASH) {
          return reject('INVALID_UNRECOGNIZED_HASH');
        }
        if (result === securePassword.INVALID) {
          return reject('INVALID');
        }
        if (result === securePassword.VALID) {
          return resolve('VALID');
        }
        if (result === securePassword.VALID_NEEDS_REHASH) {
          return resolve('VALID_NEEDS_REHASH');
        }

        reject('UNKNOWN');
      });
    });
  }

}
