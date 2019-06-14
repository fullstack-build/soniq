import { Service, Inject } from "@fullstack-one/di";
import { Config } from "@fullstack-one/config";
import { SchemaBuilder, IDbMeta } from "@fullstack-one/schema-builder";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { BootLoader } from "@fullstack-one/boot-loader";
import * as _ from "lodash";

@Service()
export class AutoMigrate {
  private logger: ILogger;
  private schemaBuilder: SchemaBuilder;
  private config: Config;

  constructor(
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => Config) config: Config,
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder
  ) {
    this.schemaBuilder = schemaBuilder;
    this.config = config;
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  public async boot() {
    // TODO: Check config automigrate = true?
    return this.runMigration();
  }

  public getDbMeta(): IDbMeta {
    // return copy instead of ref
    return _.cloneDeep(this.schemaBuilder.getDbMeta());
  }

  public async getMigrationSql() {
    const configDB = this.config.getConfig("Db");
    try {
      const fromDbMeta = await this.schemaBuilder.getPgDbMeta();
      const toDbMeta = this.getDbMeta();
      return this.schemaBuilder.getDbSchemaBuilder().getMigrationSqlStatements(fromDbMeta, toDbMeta, configDB.renameInsteadOfDrop);
    } catch (err) {
      this.logger.warn("getMigrationSql.error", err);
    }
  }

  public async runMigration() {
    const configDB = this.config.getConfig("Db");
    try {
      const fromDbMeta = await this.schemaBuilder.getPgDbMeta();
      const toDbMeta = this.getDbMeta();
      return await this.schemaBuilder.getDbSchemaBuilder().migrate(fromDbMeta, toDbMeta, configDB.renameInsteadOfDrop);
    } catch (err) {
      this.logger.warn("runMigration.error", err);
    }
  }
}
