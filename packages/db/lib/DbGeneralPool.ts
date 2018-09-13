
import { IDb } from './IDb';
import { Pool as PgPool, PoolConfig as PgPoolConfig, PoolClient as PgPoolClient, types as PgTypes } from 'pg';
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, str => str);
PgTypes.setTypeParser(1082, str => str);

export { PgPool, PgPoolClient };
import { Service, Inject, Container } from '@fullstack-one/di';
import { EventEmitter } from '@fullstack-one/events';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { IEnvironment, Config } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';

@Service()
export class DbGeneralPool implements IDb  {
  private readonly config: Config;
  private applicationName: string;
  private credentials: PgPoolConfig;
  private managedPool: PgPool;

  // DI
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private eventEmitter: EventEmitter;

  constructor(
    @Inject(type => BootLoader) bootLoader,
    @Inject(type => EventEmitter) eventEmitter,
    @Inject(type => LoggerFactory) loggerFactory,
    @Inject(type => Config) config
    ) {
    // register package config
    this.config = config;
    this.config.addConfigFolder(__dirname + '/../config');

    // DI
    this.loggerFactory = loggerFactory;
    this.eventEmitter = eventEmitter;

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));

  }

  private async boot(): Promise<void> {

    this.logger = this.loggerFactory.create(this.constructor.name);
    const env: IEnvironment = Container.get('ENVIRONMENT');
    this.applicationName = env.namespace + '_pool_' + env.nodeId;
    this.eventEmitter.on('connected.nodes.changed', (nodeId) => { this.gracefullyAdjustPoolSize(); });

    // calculate pool size and create pool
    await this.gracefullyAdjustPoolSize();
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
  get pgPool(): PgPool {
    return this.managedPool;
  }

  // calculate number of max conections and adjust pool based on number of connected nodes
  private async gracefullyAdjustPoolSize(): Promise<PgPool> {

    const configDB = this.config.getConfig('db');
    const configDbGeneral  = configDB.general;

    // get known nodes from container, initially assume we are the first one
    let knownNodesCount: number = 1;
    try {
      const knownNodes: string[] = Container.get('knownNodeIds');
      knownNodesCount = knownNodes.length;
    } catch {
      // ignore error and continue assuming we are the first client
    }

    // reserve one for setup connection
    const connectionsPerInstance: number = Math.floor((configDbGeneral.totalMax / knownNodesCount) - 1);

    // readjust pool only if number of max connections has changed
    if (this.credentials == null || this.credentials.max !== connectionsPerInstance) {

      // gracefully end previous pool if already available
      if (this.managedPool != null) {
        // don't wait for promise, we just immediately create a new pool
        // this one will end as soon as the last connection is released
        this.end();
      }

      // credentials for general connection pool with calculated pool size
      this.credentials = {
        ... configDbGeneral,
        application_name: this.applicationName,
        max: connectionsPerInstance
      };

      // create managed pool with calculated pool size
      this.managedPool  = new PgPool(this.credentials);

      this.logger.debug(`Postgres pool created (min: ${this.credentials.min} / max: ${this.credentials.max})`);
      this.eventEmitter.emit('db.general.pool.created', this.applicationName);

      // init first connection (ignore promise, connection only for "pre-heating" purposes)
      return await this.initConnect();

    }

  }

  private async initConnect(): Promise<PgPool> {

    try {
      // emit event
      this.eventEmitter.emit('db.application.pgClient.connect.start', this.applicationName);

      // create first connection to test the pool
      const poolClient = await this.managedPool.connect();

      this.logger.trace('Postgres pool initial connection created');
      this.eventEmitter.emit('db.application.pool.connect.success', this.applicationName);

      // release initial connection
      await poolClient.release();

      this.logger.trace('Postgres pool initial connection released');
      this.eventEmitter.emit('db.application.pool.connect.released', this.applicationName);

    } catch (err) {

      this.logger.warn('Postgres pool connection creation error', err);
      this.eventEmitter.emit('db.application.pool.connect.error', this.applicationName, err);

      throw err;
    }

    return this.pgPool;
  }

}
