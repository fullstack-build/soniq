
import { Service, Container, Inject } from '@fullstack-one/di';
import { Config, IEnvironment } from '@fullstack-one/config';
import { EventEmitter } from '@fullstack-one/events';
import { SchemaBuilder, IDbMeta } from '@fullstack-one/schema-builder';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';
import { DbAppClient } from '@fullstack-one/db';
import * as _ from 'lodash';

@Service()
export class AutoMigrate {

  private ENVIRONMENT: IEnvironment;
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private eventEmitter: EventEmitter;
  private schemaBuilder: SchemaBuilder;
  private config: Config;

  constructor(
    @Inject(type => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject(type => BootLoader) bootLoader: BootLoader,
    @Inject(type => Config) config: Config,
    @Inject(type => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject(type => DbAppClient) dbAppClient: DbAppClient) {

    this.loggerFactory = loggerFactory;
    this.schemaBuilder = schemaBuilder;
    this.config = config;

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public async boot() {
    this.logger = this.loggerFactory.create(this.constructor.name);
    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');

    // TODO: Check config automigrate = true?
    return await this.runMigration();
  }

  public getDbMeta(): IDbMeta {
    // return copy instead of ref
    return _.cloneDeep(this.schemaBuilder.getDbMeta());
  }

  public async getMigrationSql() {
    const configDB = this.config.getConfig('db');
    try {
      const fromDbMeta      = await this.schemaBuilder.getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      return this.schemaBuilder.getDbSchemaBuilder().getMigrationSqlStatements(fromDbMeta, toDbMeta, configDB.renameInsteadOfDrop);

    } catch (err) {
      this.logger.warn('getMigrationSql.error', err);
    }
  }

  public async runMigration() {

    const configDB = this.config.getConfig('db');
    try {
      const fromDbMeta      = await this.schemaBuilder.getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      return await this.schemaBuilder.getDbSchemaBuilder().migrate(fromDbMeta, toDbMeta, configDB.renameInsteadOfDrop);

    } catch (err) {
      this.logger.warn('runMigration.error', err);
    }
  }

}
