
import { Service, Container, Inject } from '@fullstack-one/di';
import { Config, IEnvironment } from '@fullstack-one/config';
import { EventEmitter } from '@fullstack-one/events';
import { Migration } from '@fullstack-one/migration';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';
import { IDbMeta, PgToDbMeta, DbAppClient } from '@fullstack-one/db';
import { GraphQlParser } from '@fullstack-one/graphql-parser';
import * as _ from 'lodash';

@Service()
export class AutoMigrate {

  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  private eventEmitter: EventEmitter;
  private gqlParser: GraphQlParser;
  private config: Config;

  constructor(
    @Inject(type => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject(type => BootLoader) bootLoader: BootLoader,
    @Inject(type => Config) config: Config,
    @Inject(type => GraphQlParser) gqlParser: GraphQlParser,
    @Inject(type => DbAppClient) dbAppClient: DbAppClient) {

    this.logger = loggerFactory.create('AutoMigrate');
    this.gqlParser = gqlParser;
    this.config = config;

    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public async boot() {
    // TODO: Check config automigrate
    return await this.runMigration();
  }

  public getDbMeta(): IDbMeta {
    // return copy instead of ref
    return _.cloneDeep(this.gqlParser.getDbMeta());
  }

  public async getMigrationSql() {
    const configDB = this.config.getConfig('db');
    try {
      const fromDbMeta      = await (new PgToDbMeta()).getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      // TODO: @eugene: Migration should be a Migration-Factory
      const migration       = new Migration(fromDbMeta, toDbMeta, this.config, Container.get(LoggerFactory), Container.get(DbAppClient));
      return migration.getMigrationSqlStatements(configDB.renameInsteadOfDrop);

    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('ERROR', err);
    }
  }

  public async runMigration() {

    const configDB = this.config.getConfig('db');
    try {
      const pgToDbMeta = Container.get(PgToDbMeta);
      const fromDbMeta      = await pgToDbMeta.getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      // TODO: @eugene: Migration should be a Migration-Factory
      const migration       = new Migration(fromDbMeta, toDbMeta, this.config, Container.get(LoggerFactory), Container.get(DbAppClient));
      return await migration.migrate(configDB.renameInsteadOfDrop);

    } catch (err) {
      // tslint:disable-next-line:no-console
      this.logger.warn('runMigration.error', err);
    }
  }

}
