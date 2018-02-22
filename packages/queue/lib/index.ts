import * as PgBoss from 'pg-boss';
export { PgBoss };

import { Service, Inject, Container } from '@fullstack-one/di';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { DbGeneralPool } from '@fullstack-one/db';
import { Config } from '@fullstack-one/config';

@Service()
export class QueueFactory {

  private queue: PgBoss;

  // DI
  private logger: ILogger;
  private generalPool: DbGeneralPool;

  constructor(
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(type => DbGeneralPool) generalPool?,
    @Inject(type => Config) config?
  ) {

    // set DI dependencies
    this.generalPool = generalPool;
    this.logger = loggerFactory.create('Queue');
  }

  public async getQueue(): Promise<PgBoss> {
    // create queue if not yet available
    if (this.queue == null) {
      await this.start();
    }

    return this.queue;
  }

  private async start(): Promise<PgBoss> {

    let boss;
    const queueConfig = Container.get(Config).getConfig('queue');

    // create new connection if set in config, otherwise use one from the pool
    if (queueConfig != null &&
        queueConfig.host &&
        queueConfig.database &&
        queueConfig.user &&
        queueConfig.password) {
      // create a PGBoss instance
      boss = new PgBoss(queueConfig);
    } else {

      // get new connection from the pool
      const pgCon = await this.generalPool.pgPool.connect();

      // Add `close` and `executeSql` functions for PgBoss to function
      const pgBossDB = Object.assign(pgCon, {
        close: pgCon.end, // Not required
        executeSql: pgCon.query
      });

      // create a PGBoss instance
      boss = new PgBoss({ db: pgBossDB, ... queueConfig });
    }

    // log errors to warn
    boss.on('error', this.logger.warn);
    // try to start PgBoss
    try {
      this.queue = await boss.start();
    } catch (err) {
      this.logger.warn('start.error', err);
    }
    return this.queue;
  }

}
