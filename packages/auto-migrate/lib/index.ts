import { Service, Inject } from "@fullstack-one/di";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { BootLoader } from "@fullstack-one/boot-loader";

@Service()
export class AutoMigrate {
  private logger: ILogger;
  private schemaBuilder: SchemaBuilder;

  constructor(
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder
  ) {
    this.schemaBuilder = schemaBuilder;
    this.logger = loggerFactory.create(this.constructor.name);

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
