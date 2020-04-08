import * as PgBoss from "pg-boss";
export { PgBoss };

import { BootLoader } from "@fullstack-one/boot-loader";
import { Config } from "@fullstack-one/config";
import { ORM } from "@fullstack-one/db";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";

@Service()
export class QueueFactory {
  private queue: PgBoss;
  private readonly logger: ILogger;

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => GracefulShutdown) gracefulShutdown: GracefulShutdown,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => ORM) private readonly orm: ORM,
    @Inject((type) => Config) config: Config
  ) {
    config.registerConfig("Queue", `${__dirname}/../config`);
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
  }

  private async boot(): Promise<void> {
    let boss: PgBoss;
    const queueConfig = Container.get(Config).getConfig("Queue");

    // create new connection if set in config, otherwise use one from the pool
    if (queueConfig != null && queueConfig.host != null && queueConfig.database != null && queueConfig.user != null && queueConfig.password != null) {
      // create a PGBoss instance
      boss = new PgBoss(queueConfig);
    } else {
      const queryRunner = this.orm.createQueryRunner();
      await queryRunner.connect();

      // Add `close` and `executeSql` functions for PgBoss to function
      const pgBossDB = {
        close: () => queryRunner.release(),
        executeSql: async (...args) => {
          return queryRunner.query.apply(queryRunner, args);
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

  private async end(): Promise<void> {
    if (this.queue != null) await this.queue.disconnect();
  }

  public getQueue(): PgBoss {
    if (this.queue != null) {
      return this.queue;
    } else {
      throw new Error("Queue.not.ready");
    }
  }
}
