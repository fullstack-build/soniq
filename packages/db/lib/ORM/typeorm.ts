import { Service, Inject, Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { Client as PgClient, types as PgTypes } from "pg";
import { IDbConfig, IDbAppClientConfig } from "../IDbConfig";
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str: any) => str);
PgTypes.setTypeParser(1082, (str: any) => str);

export { PgClient };
import { createConnection, getManager } from "typeorm";
export { BaseEntity, Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

import { Photo } from "./models/Photo";

@Service()
export class ORM {
  private applicationNamePrefix: string;
  private applicationName: string;
  private readonly credentials: IDbAppClientConfig | any;

  private readonly ENVIRONMENT: IEnvironment;
  private readonly logger: ILogger;
  private readonly config: IDbConfig;
  private readonly eventEmitter: EventEmitter;
  public readonly databaseName: string;
  public pgClient: PgClient;

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => GracefulShutdown) gracefulShutdown: GracefulShutdown,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter
  ) {
    this.config = config.registerConfig("Db", `${__dirname}/../../config`);
    this.eventEmitter = eventEmitter;
    this.credentials = this.config.typeorm;
    this.databaseName = this.credentials.database;

    this.ENVIRONMENT = Container.get("ENVIRONMENT");
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
  }

  private async boot(): Promise<void> {
    try {
      this.credentials.entities = [Photo];
      const connection = await createConnection(this.credentials);
      console.error("****", connection);

      connection.driver.afterConnect().then(() => {
        console.log(">> after connect");
      });

      const photo = new Photo();
      photo.name = "Misha and Bears";
      photo.description = "I am near polar bears";
      photo.filename = "photo-with-bears.jpg";
      photo.views = 1;
      photo.isPublished = true;
      photo.save();
      console.log("Photo has been saved");

      const entityManager = getManager(); // you can also get it via getConnection().manager
      const photo1 = await entityManager.findOne(Photo, 1);
      console.log(">>> photo1:", photo1);

      await connection.close();
      await connection.connect();

      const photo2 = await entityManager.findOne(Photo, 2);
      console.log(">>> photo2:", photo2);
    } catch (err) {
      console.error("####", err);
    }
  }

  private async end(): Promise<void> {
    // ...
  }
}
