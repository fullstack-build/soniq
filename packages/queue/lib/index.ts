import * as PgBoss from "pg-boss";
export { PgBoss };

import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { DbGeneralPool } from "@fullstack-one/db";
import { Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";

@Service()
export class QueueFactory {
  private queue: PgBoss;

  // DI
  private logger: ILogger;
  private generalPool: DbGeneralPool;

  constructor(
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => DbGeneralPool) generalPool,
    @Inject((type) => Config) config: Config
  ) {
    // set DI dependencies
    this.generalPool = generalPool;

    // register package config
    config.registerConfig("Queue", `${__dirname}/../config`);
    // init logger
    this.logger = loggerFactory.create(this.constructor.name);

    // add to boot loader
    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot(): Promise<void> {
    let boss;
    const queueConfig = Container.get(Config).getConfig("Queue");

    // create new connection if set in config, otherwise use one from the pool
    if (queueConfig != null && queueConfig.host && queueConfig.database && queueConfig.user && queueConfig.password) {
      // create a PGBoss instance
      boss = new PgBoss(queueConfig);
    } else {
      if (this.generalPool.pgPool == null) {
        throw Error("DB.generalPool not ready");
      }

      // get new connection from the pool
      const pgCon = await this.generalPool.pgPool.connect();

      // Add `close` and `executeSql` functions for PgBoss to function
      const pgBossDB = {
        close: pgCon.release, // Not required
        executeSql: async (...args) => {
          return pgCon.query.apply(pgCon, args);
        }
      };

      // create a PGBoss instance
      boss = new PgBoss({ db: pgBossDB, ...queueConfig });
    }

    // log errors to warn
    boss.on("error", this.logger.warn);
    // try to start PgBoss
    try {
      this.queue = await boss.start();
    } catch (err) {
      this.logger.warn("start.error", err);
    }
  }

  public getQueue(): PgBoss {
    if (this.queue != null) {
      return this.queue;
    } else {
      throw new Error("Queue.not.ready");
    }
  }
}
