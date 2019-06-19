<<<<<<< HEAD
import { Service, Inject } from "@fullstack-one/di";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { BootLoader } from "@fullstack-one/boot-loader";
=======
import { Service, Container, Inject } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { SchemaBuilder, IDbMeta } from "@fullstack-one/schema-builder";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { BootLoader } from "@fullstack-one/boot-loader";
import { DbAppClient } from "@fullstack-one/db";
import * as _ from "lodash";
>>>>>>> master

@Service()
export class AutoMigrate {
  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  private schemaBuilder: SchemaBuilder;

  constructor(
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => BootLoader) bootLoader: BootLoader,
<<<<<<< HEAD
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder
=======
    @Inject((type) => Config) config: Config,
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject((type) => DbAppClient) dbAppClient: DbAppClient
>>>>>>> master
  ) {
    // DI
    this.schemaBuilder = schemaBuilder;
<<<<<<< HEAD
=======
    this.config = config;
    // init logger
>>>>>>> master
    this.logger = loggerFactory.create(this.constructor.name);
    // get settings from DI container
    this.ENVIRONMENT = Container.get("ENVIRONMENT");

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  public async boot() {
    return this.runMigration();
  }

  public async runMigration() {
    try {
      return await this.schemaBuilder.getDbSchemaBuilder().migrate();
    } catch (err) {
      this.logger.warn("runMigration.error", err);
    }
  }
}
