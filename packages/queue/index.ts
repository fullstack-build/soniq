import * as PgBoss from 'pg-boss';
export { PgBoss };

import * as One from '../core';

export class Queue extends One.AbstractPackage {
  private queue;

  constructor() {
    super();
  }

  public async start(): Promise<PgBoss> {

    let boss;
    const queueConfig = this.CONFIG;

    // create new connection if set in config, otherwise use one from the pool
    if (queueConfig != null &&
        queueConfig.host &&
        queueConfig.database &&
        queueConfig.user &&
        queueConfig.password) {
      // create a PGBoss instance
      boss = new PgBoss(queueConfig);
    } else {

      // get new conenction from the pool
      const pgCon = await this.$one.getDbPool().connect();

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
