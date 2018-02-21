
import { Service, Container, Inject } from '@fullstack-one/di';
import { Config, IEnvironment } from '@fullstack-one/config';
import { EventEmitter } from '@fullstack-one/events';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';

import * as fastGlob from 'fast-glob';

@Service()
export class BootScripts {

  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  private eventEmitter: EventEmitter;

  constructor(
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(tpye => BootLoader) bootLoader?) {

    this.logger = loggerFactory.create('BootScripts');

    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');

    bootLoader.addBootFunction(this.boot);
  }

  public async boot() {
    return await this.runMigration();
  }

  public getDbMeta(): IDbMeta {
    // return copy instead of ref
    return _.cloneDeep(this.dbMeta);
  }

  public async getMigrationSql() {
    const configDB = this.getConfig('db');
    try {
      const fromDbMeta      = await (new PgToDbMeta()).getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      const migration       = new Migration(fromDbMeta, toDbMeta);
      return migration.getMigrationSqlStatements(configDB.renameInsteadOfDrop);

    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('ERROR', err);
    }
  }

  public async runMigration() {

    const configDB = this.getConfig('db');
    try {
      const pgToDbMeta = Container.get(PgToDbMeta);
      const fromDbMeta      = await pgToDbMeta.getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      const migration       = new Migration(fromDbMeta, toDbMeta);
      return await migration.migrate(configDB.renameInsteadOfDrop);

    } catch (err) {
      // tslint:disable-next-line:no-console
      this.logger.warn('runMigration.error', err);
    }
  }

}
