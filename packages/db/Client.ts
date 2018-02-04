import * as F1 from '../core';
import { IDb } from './IDb';
import { Client as PgClient, ClientConfig as PgClientConfig } from 'pg';
export { PgClient };
// import * as massive from 'massive';

export class DbClient extends F1.AbstractPackage implements IDb {
  public readonly client: PgClient;
  private massiveClient;

  private credentials;

  constructor(
    pCredentials: PgClientConfig
  ) {
    super();

    this.credentials  = pCredentials;
    this.client       = new PgClient(this.credentials);
  }

  public async create(): Promise<PgClient> {

    /*this.massiveClient = await massive(this.credentials);
    console.error(this.massiveClient);
    console.error('**', await this.massiveClient.UserView.find());
    console.error('##', await this.massiveClient.UserView.insert({
      email: 'huhu@fullstack.build',
      gender: 'male'}));*/

    try {
      // getSqlFromMigrationObj connection
      await this.client.connect();
      this.logger.info('Postgres connection created');
    } catch (err) {
      throw err;
    }

    return this.client;
  }

  public async end(): Promise<void> {
    return await this.client.end();
  }

}
