import * as PgBoss from 'pg-boss';
export { PgBoss };

import * as ONE from '../core';

@ONE.Service()
export class Queue {
  private queue;

  // DI
  private logger: ONE.ILogger;

  constructor(
    @ONE.Inject(type => ONE.LoggerFactory) loggerFactory?
  ) {
    // set DI dependencies
    this.logger = loggerFactory.create('Queue');
  }

  public async start(): Promise<PgBoss> {

    let boss;
    const queueConfig = ONE.Container.get('CONFIG').queue;

    // create new connection if set in config, otherwise use one from the pool
    if (queueConfig != null &&
        queueConfig.host &&
        queueConfig.database &&
        queueConfig.user &&
        queueConfig.password) {
      // create a PGBoss instance
      boss = new PgBoss(queueConfig);
    } else {

      // get connection pool from DI container
      const pool = ONE.Container.get(ONE.DbGeneralPool).pool;

      // get new connection from the pool
      const pgCon = await pool.connect();

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

    try {
      this.queue = await boss.start();
    } catch (err) {
      this.logger.warn('start.error', err);
    }

    return this.queue;
  }

  public getQueue(): PgBoss {
    return this.queue;
  }

}
