import { Service, Inject, Container } from '@fullstack-one/di';
import { EventEmitter } from '@fullstack-one/events';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { IEnvironment, Config } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';
import { IDb } from './IDb';
import { Client as PgClient, ClientConfig as PgClientConfig, types as PgTypes } from 'pg';
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, str => str);
PgTypes.setTypeParser(1082, str => str);

export { PgClient };

@Service()
export class DbAppClient implements IDb {

  public pgClient: PgClient;

  private applicationName: string;
  // todo application_name not available in pg.ClientConfig <- check and add it there
  // private credentials: PgClientConfig;
  private credentials: any;

  // DI
  private readonly ENVIRONMENT: IEnvironment;
  private readonly config: Config;
  private readonly logger: ILogger;
  private readonly eventEmitter: EventEmitter;
  private readonly CONFIG;

  constructor(
    @Inject(type => BootLoader) bootLoader,
    @Inject(type => EventEmitter) eventEmitter,
    @Inject(type => LoggerFactory) loggerFactory,
    @Inject(type => Config) config
  ) {
    // set DI dependencies
    this.config = config;
    this.eventEmitter = eventEmitter;

    // register package config
    this.CONFIG = this.config.registerConfig('Db', __dirname + '/../config');

    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');
    // init logger
    this.logger = loggerFactory.create(this.constructor.name);

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));
  }

  private async boot(): Promise<PgClient> {

    this.credentials  = this.CONFIG.appClient;
    this.applicationName = this.credentials.application_name = this.ENVIRONMENT.namespace + '_client_' + this.ENVIRONMENT.nodeId;

    // create PG pgClient
    this.pgClient  = new PgClient(this.credentials);

    this.logger.debug('Postgres setup pgClient created');
    this.eventEmitter.emit('db.application.pgClient.created', this.applicationName);

    // collect known nodes
    this.eventEmitter.onAnyInstance('db.application.client.connect.success', (nodeId) => {
      this.updateNodeIdsFromDb();
    });

    // update number of clients on exit
    this.eventEmitter.onAnyInstance('db.application.client.end.start', (nodeId) => {
      // wait one tick until it actually finishes
      process.nextTick(() => { this.updateNodeIdsFromDb(); });
    });

    // check connected clients every x secons
    const updateClientListInterval = this.CONFIG.updateClientListInterval || 10000;
    setInterval(this.updateNodeIdsFromDb.bind(this), updateClientListInterval);

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
        knownNodeIds = Container.get('knownNodeIds');
      } catch {
        // ignore error
      }

      if (knownNodeIds.length !== nodeIds.length) {
        knownNodeIds = nodeIds;
        // update known IDs in DI
        Container.set('knownNodeIds', knownNodeIds);

        this.logger.debug('Postgres number connected clients changed', knownNodeIds);
        this.eventEmitter.emit('connected.nodes.changed');
      }

    } catch (err) {
      this.logger.warn('updateNodeIdsFromDb', err);
    }
  }

}
