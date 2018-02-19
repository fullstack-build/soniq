import * as ONE from '../core';
import { IDb } from './IDb';
import { Client as PgClient, ClientConfig as PgClientConfig } from 'pg';
export { PgClient };

@ONE.Service()
export class DbAppClient extends ONE.AbstractPackage implements IDb {

  public readonly pgClient: PgClient;

  private readonly applicationName: string;
  // todo application_name not available in pg.ClientConfig <- check and add it there
  // private credentials: PgClientConfig;
  private credentials: any;

  // DI
  private ENVIRONMENT: ONE.IEnvironment;
  private logger: ONE.ILogger;
  private eventEmitter: ONE.EventEmitter;

  constructor(
    @ONE.Inject(type => ONE.EventEmitter) eventEmitter?,
    @ONE.Inject(type => ONE.LoggerFactory) loggerFactory?
  ) {
    super();

    // set DI dependencies
    this.eventEmitter = eventEmitter;
    this.logger = loggerFactory.create('DbAppClient');

    // get settings from DI container
    this.ENVIRONMENT = ONE.Container.get('ENVIRONMENT');

    const configDB = this.getConfig('db');
    this.credentials  = configDB.appClient;
    this.applicationName = this.credentials.application_name = this.ENVIRONMENT.namespace + '_client_' + this.ENVIRONMENT.nodeId;

    // create PG pgClient
    this.pgClient  = new PgClient(this.credentials);

    this.logger.debug('Postgres setup pgClient created');
    this.eventEmitter.emit('db.application.pgClient.created', this.applicationName);

    // collect known nodes
    this.eventEmitter.onAnyInstance(`db.application.client.connect.success`, (nodeId) => {
      this.updateNodeIdsFromDb();
    });

    // update number of clients on exit
    this.eventEmitter.onAnyInstance(`db.application.client.end.start`, (nodeId) => {
      // wait one tick until it actually finishes
      process.nextTick(() => { this.updateNodeIdsFromDb(); });
    });

    // check connected clients every x secons
    const updateClientListInterval = configDB.updateClientListInterval || 10000;
    setInterval(this.updateNodeIdsFromDb.bind(this), updateClientListInterval);

  }

  public async connect(): Promise<PgClient> {

    try {
      this.eventEmitter.emit('db.application.pgClient.connect.start', this.applicationName);

      // getSqlFromMigrationObj connection
      await this.pgClient.connect();

      this.logger.trace('Postgres setup connection created');
      this.eventEmitter.emit('db.application.pgClient.connect.success', this.applicationName);

    } catch (err) {

      this.logger.warn('Postgres setup connection creation error', err);
      this.eventEmitter.emit('db.application.pgClient.connect.error', this.applicationName, err);

      throw err;
    }

    return this.pgClient;
  }

  public async end(): Promise<void> {

    this.logger.trace('Postgres connection ending initiated');
    this.eventEmitter.emit('db.application.pgClient.end.start', this.applicationName);

    try {

      const clientEndResult = await this.pgClient.end();

      this.logger.trace('Postgres connection ended successfully');
      // can only be caught locally (=> db connection ended)
      this.eventEmitter.emit('db.application.pgClient.end.success', this.applicationName);

      return clientEndResult;
    } catch (err) {

      this.logger.warn('Postgres connection ended with an error', err);
      this.eventEmitter.emit('db.application.pgClient.end.error', this.applicationName, err);

      throw err;
    }

  }

  private async updateNodeIdsFromDb(): Promise<void> {

    try {
      const dbName = this.credentials.database;
      const applicationNamePrefix = `${this.ENVIRONMENT.namespace}_client_`;
      const dbNodes = await this.pgClient.query(
        `SELECT * FROM pg_stat_activity WHERE datname = '${dbName}' AND application_name LIKE '${applicationNamePrefix}%';`
      );

      // collect all connected node IDs
      const nodeIds: [string] = dbNodes.rows.map((row) => {
        // remove prefix from node name and keep only node ID
        return row.application_name.replace(applicationNamePrefix, '');
      }) as [string];

      // check if number of nodes has changed
      let knownNodeIds: string[] = [];
      try {
        knownNodeIds = ONE.Container.get('knownNodeIds');
      } catch {
        // ignore error
      }

      if (knownNodeIds.length !== nodeIds.length) {
        knownNodeIds = nodeIds;
        // update known IDs in DI
        ONE.Container.set('knownNodeIds', knownNodeIds);

        this.logger.debug('Postgres number connected clients changed', knownNodeIds);
        this.eventEmitter.emit('connected.nodes.changed');
      }

    } catch (err) {
      this.logger.warn('updateNodeIdsFromDb', err);
    }
  }

}
