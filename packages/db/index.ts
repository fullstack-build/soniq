import { Client, Pool, PoolConfig } from 'pg';
export { Client, Pool } from 'pg';

export class Db {
  private $one;
  private logger;
  private credentials;
  private client: Client;
  private pool: Pool;

  constructor(
    pFullStackOneCore: any,
    pCredentials: PoolConfig
  ) {
    this.$one         = pFullStackOneCore;
    this.logger       = pFullStackOneCore.getLogger('db');
    this.credentials  = pCredentials;

    /*if (!pIsPool) { // create client

    } else { // create pool
      this.pool = new Pool(pCredentials);
      this.logger.info('Postgres pool created');
    }*/
  }

  public async createClient(): Promise<Client> {
    // create connection if not yet available
    if (this.client == null) {
      try {
        this.client = new Client(this.credentials);

        // create connection
        await this.client.connect();
        this.logger.info('Postgres connection created');
      } catch (err) {
        throw err;
      }
    }

    return this.client;
  }

  public getClient(): Client {
    return this.client;
  }

  public async endClient(): Promise<void> {
    if (this.client != null) {
      return await this.client.end();
    } else {
      return;
    }
  }

  public async createPool(): Promise<Pool> {
    // create pool if not yet available
    if (this.pool == null) {
      try {
        this.pool = new Pool(this.credentials);

        // create first connection
        const client = await this.pool.connect();
        try {
          this.logger.info('Postgres pool created');
        } finally {
          client.release();
        }

      } catch (err) {
        throw err;
      }
    }

    return this.pool;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async endPool(): Promise<void> {
    if (this.pool != null) {
      return await this.pool.end();
    } else {
      return;
    }
  }
}
