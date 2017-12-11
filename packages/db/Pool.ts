import * as F1 from '../core';
import { IDb } from './IDb';
import { Pool as PgPool, PoolConfig as PgPoolConfig } from 'pg';
export { PgPool };

export class DbPool extends F1.AbstractPackage implements IDb {
  public readonly pool: PgPool;
  private credentials;

  constructor(
    $one: F1.IFullstackOneCore,
    pCredentials: PgPoolConfig
  ) {

    super($one);
    this.credentials  = pCredentials;
    this.pool         = new PgPool(this.credentials);
  }

  public async create(): Promise<PgPool> {
    try {
      // create first connection
      const pool = await this.pool.connect();
      try {
        this.logger.info('Postgres pool created');
      } finally {
        pool.release();
      }

    } catch (err) {
      throw err;
    }

    return this.pool;
  }

  public async end(): Promise<void> {
    return await this.pool.end();
  }
}
