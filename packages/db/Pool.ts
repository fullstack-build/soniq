import * as F1 from '../core';
import { IDb } from './IDb';
import { Pool as PgPool, PoolConfig as PgPoolConfig } from 'pg';
export { PgPool };

export class DbPool extends F1.AbstractPackage implements IDb {
  public readonly pool: PgPool;
  private credentials;

  constructor(
    pCredentials: PgPoolConfig
  ) {

    super();
    this.credentials  = pCredentials;
    this.pool         = new PgPool(this.credentials);
  }

  public async create(): Promise<PgPool> {
    try {
      // create first connection
      const pool = await this.pool.connect();
      try {
        this.logger.info(`Postgres pool created (min: ${this.credentials.min} / max: ${this.credentials.max})`);
      } finally {
        pool.release();
      }

    } catch (err) {
      throw err;
    }

    return this.pool;
  }

  public async end(): Promise<void> {
    this.logger.info('Postgres pool ended');
    return await this.pool.end();
  }
}
