import { Client, Pool, PoolConfig } from 'pg';

export class Db {

  private logger;
  private client: Client;
  private clientConnection;
  private pool: Pool;

  constructor(pFullStackOneCore: any, pCredentials: PoolConfig, pIsPool: boolean = false) {
    this.logger = pFullStackOneCore.getLogger('db');

    if (!pIsPool) { // create client
      this.client = new Client(pCredentials);
      this.logger.info('Postgres connection created');
    } else { // create pool
      this.pool = new Pool(pCredentials);
      this.logger.info('Postgres pool created');
    }
  }

}
