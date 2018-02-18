import * as ONE from '../core';
import { IDb } from './IDb';
import { Pool as PgPool, PoolConfig as PgPoolConfig } from 'pg';
export { PgPool };

@ONE.Service()
export class DbGeneralPool implements IDb {
  private readonly config: any;
  private readonly applicationName: string;
  private credentials: PgPoolConfig;
  private managedPool: PgPool;

  // DI
  private logger: ONE.ILogger;
  private eventEmitter: ONE.EventEmitter;

  constructor(
    @ONE.Inject(type => ONE.EventEmitter) eventEmitter?,
    @ONE.Inject(type => ONE.LoggerFactory) loggerFactory?
    ) {
    this.eventEmitter = eventEmitter;
    this.logger = loggerFactory.create('DbGeneralPool');

    const env: ONE.IEnvironment = ONE.Container.get('ENVIRONMENT');
    this.config = ONE.Container.get('CONFIG');

    this.config = this.config.db.general;
    this.applicationName = env.namespace + '_pool_' + env.nodeId;

    this.eventEmitter.on('connected.nodes.changed', (nodeId) => { this.gracefullyAdjustPoolSize(); });

    // calculate pool size and create pool
    this.gracefullyAdjustPoolSize();

  }

  public async connect(): Promise<PgPool> {

    // wait for the pool in case it is not ready yet
    if (this.managedPool == null) {
      await this.gracefullyAdjustPoolSize();
    }

    // check if pool exists or was created above, otherwise ignore
    if (this.managedPool != null) {
      try {
        // emit event
        this.eventEmitter.emit('db.application.client.connect.start', this.applicationName);

        // create first connection to test the pool
        const pool = await this.managedPool.connect();

        this.logger.info('Postgres pool initial connection created');
        this.eventEmitter.emit('db.application.pool.connect.success', this.applicationName);

        // release initial connection
        await pool.release();

        this.logger.info('Postgres pool initial connection released');
        this.eventEmitter.emit('db.application.pool.connect.released', this.applicationName);

      } catch (err) {

        this.logger.warn('Postgres pool connection creation error', err);
        this.eventEmitter.emit('db.application.pool.connect.error', this.applicationName, err);

        throw err;
      }
    }

    return this.pool;
  }

  public async end(): Promise<void> {

    this.logger.trace('Postgres pool ending initiated');
    this.eventEmitter.emit('db.application.pool.end.start', this.applicationName);

    try {
      const poolEndResult = await this.managedPool.end();

      this.logger.trace('Postgres pool ended successfully');
      // can only be caught locally (=> db connection ended)
      this.eventEmitter.emit('db.application.pool.end.success', this.applicationName);

      return poolEndResult;
    } catch (err) {

      this.logger.warn('Postgres pool ended with an error', err);
      this.eventEmitter.emit('db.application.pool.end.error', this.applicationName, err);

      throw err;
    }

  }

  // return public readonly instance of the managed pool
  get pool() {
    return this.managedPool;
  }

  private create(): void {
    this.managedPool  = new PgPool(this.credentials);

    this.logger.info(`Postgres pool created (min: ${this.credentials.min} / max: ${this.credentials.max})`);
    this.eventEmitter.emit('db.general.pool.created', this.applicationName);
  }

  // calculate number of max conections and adjust pool based on number of connected nodes
  private async gracefullyAdjustPoolSize(): Promise<void> {

    // gracefully end pool if already available
    if (this.managedPool != null) {
      // don't wait for promise, we just immediately create a new pool
      // this one will end as soon as the last connection is released
      this.end();
    }

    // get known nodes from container
    let knownNodesCount: number = 0;
    try {
      const knownNodes: string[] = ONE.Container.get('knownNodeIds');
      knownNodesCount = knownNodes.length;
    } catch {
      // ignore error and don't create a pool yet
      return;
    }

    // reserve one for setup connection
    const connectionsPerInstance: number = Math.floor((this.config.totalMax / knownNodesCount) - 1);

    // credentials for general connection pool with calculated pool size
    this.credentials = {
      ... this.config,
      application_name: this.applicationName,
      max: connectionsPerInstance
    };

    // create pool
    await this.create();

  }

}
