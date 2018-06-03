import * as _ from 'lodash';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';
import { diff } from 'deep-diff';

import { BootLoader } from '@fullstack-one/boot-loader';
import { Service, Container, Inject } from '@fullstack-one/di';
import { Config, IEnvironment } from '@fullstack-one/config';
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { DbAppClient } from '@fullstack-one/db';
import { IDbMeta } from './IDbMeta';
import { migrationObject } from './migrationObject';
import createViewsFromDbMeta from './createViewsFromDbMeta';
import { sqlObjFromMigrationObject } from './createSqlObjFromMigrationObject';

export { registerDirectiveParser } from './graphql/directiveParser';

@Service()
export class DbSchemaBuilder {

  private fromDbMeta: IDbMeta;
  private toDbMeta: IDbMeta;
  private migrationObject: IDbMeta;
  private dbAppClient: DbAppClient;
  private initSqlPaths = [__dirname + '/../..'];
  private extensionsPaths: string[] = [];

  // DI
  private logger: ILogger;

  constructor(@Inject(type => BootLoader) bootLoader?,
              @Inject(type => Config) config?: Config,
              @Inject(type => LoggerFactory) loggerFactory?: LoggerFactory,
              @Inject(type => DbAppClient) dbAppClient?: DbAppClient) {

    // create logger
    this.logger = loggerFactory.create('DbSchemaBuilder');
    this.dbAppClient = dbAppClient;

    // set all initial extensions
    this.extensionsPaths = fastGlob.sync(`${__dirname}/extensions/*.ts`, {
        deep: true,
        onlyFiles: true,
      });

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));
  }
  // add extensions path
  public addExtensionPath(extensionPath) {
    if (!this.extensionsPaths.includes(extensionPath)) {
      this.extensionsPaths.push(extensionPath);
    }
  }

  // add paths with migration sql scripts
  public addMigrationPath(path: string) {
    this.initSqlPaths.push(path);
  }

  public getMigrationDbMeta(): IDbMeta {
    return _.cloneDeep(this.migrationObject);
  }

  // run packages migration scripts based on initiated version
  public async initDb(): Promise<void> {

    // get DB pgClient from DI container
    const dbClient = Container.get(DbAppClient).pgClient;

    // check latest version migrated
    let latestVersion = 0;
    try {
      const dbInitVersion = (await dbClient.query(`SELECT value FROM _meta.info WHERE key = 'version';`)).rows[0];

      if (dbInitVersion != null && dbInitVersion.value != null) {
        latestVersion = parseInt(dbInitVersion.value, 10);
        this.logger.debug('migration.db.init.version.detected', latestVersion);
      }
    } catch (err) {
      this.logger.info('migration.db.init.not.found');
    }

    // find init scripts to ignore (version lower than the current one)
    const initSqlFolders = [];
    // run through all registered packages
    this.initSqlPaths.map((initSqlPath) => {
      // find all init_sql folders
      fastGlob.sync(`${initSqlPath}/sql/[0-9]*`, {
        deep: false,
        onlyDirectories: true,
      }).map((path) => {
        const pathVersion: number = parseInt(path.toString().split('/').pop(), 10);
        // keep only those with a higher version than the currently installed
        if (latestVersion < pathVersion) {
          initSqlFolders.push(path);
        }
      });
    });

    // iterate all active paths and collect all files grouped by types (suffix)
    const loadFilesOrder  = {};
    // suffix types
    const loadSuffixOrder = ['extension', 'schema', 'table', 'function', 'set', 'insert', 'select'];
    // will try, but ignore any errors
    const loadOptionalSuffixOrder = ['type', 'operator_class'];
    initSqlFolders.map((initSqlFolder) => {
      // iterate all suffixes
      for (const suffix of [...loadSuffixOrder, ...loadOptionalSuffixOrder]) {
        const paths = fastGlob.sync(`${initSqlFolder}/*.${suffix}.sql`, {
          deep: true,
          onlyFiles: true,
        });

        // load content
        for (const filePath of paths) {
          loadFilesOrder[suffix] = loadFilesOrder[suffix] || [];
          const filePathStr = filePath.toString();
          loadFilesOrder[suffix][filePathStr] = fs.readFileSync(filePathStr, 'utf8');
        }
      }
    });

    // only if there are migration folders left
    if (Object.keys(loadFilesOrder).length > 0) {
      // run migration sql - mandatory
      try {
        // create transaction
        this.logger.trace('migration.db.init.mandatory.begin');
        await dbClient.query('BEGIN');

        for (const suffix of loadSuffixOrder) {
          if (loadFilesOrder[suffix] != null) {
            for (const entry of Object.entries(loadFilesOrder[suffix])) {
              const path = entry[0];
              const statement = entry[1].toString();
              try {
                this.logger.trace('migration.db.init.mandatory.file', path);
                await  dbClient.query(statement, null);
              } catch (err) {
                // error -> rollback
                this.logger.trace('migration.db.init.mandatory.error', suffix, path, err);
                throw err;
              }
            }
          }
        }

        // commit
        this.logger.trace('migration.db.init.mandatory.commit');
        await dbClient.query('COMMIT');
      } catch (err) {
        // rollback
        this.logger.trace('migration.db.init.mandatory.rollback', err);
        await dbClient.query('ROLLBACK');
        throw err;
      }

      // run migration sql - optional (no transaction, just ignore if one fails)
      for (const suffix of loadOptionalSuffixOrder) {
        if (loadFilesOrder[suffix] != null) {
          for (const entry of Object.entries(loadFilesOrder[suffix])) {
            const path = entry[0];
            const statement = entry[1].toString();
            try {
              this.logger.trace('migration.db.init.optional.file', path);
              await  dbClient.query(statement, null);
            } catch (err) {
              // error -> rollback
              this.logger.warn('migration.db.init.optional.failed', suffix, path);
            }
          }
        }
      }

    }

  }

  // create migration SQL statements out of two dbMeta objects (pg and GQL)
  public getMigrationSqlStatements(fromDbMeta: IDbMeta,
                                   toDbMeta: IDbMeta,
                                   renameInsteadOfDrop: boolean = true): string[] {

    // check if toDbMeta is empty -> Parsing error
    if (toDbMeta == null || Object.keys(toDbMeta).length === 0) {
      throw new Error(`Migration Error: Provided migration final state is empty.`);
    }

    // crete copy of objects
    // new
    this.fromDbMeta = _.cloneDeep(fromDbMeta);
    // remove views and exposed names
    delete fromDbMeta.exposedNames;

    // old
    this.toDbMeta = _.cloneDeep(toDbMeta);
    // remove views and exposed names
    delete toDbMeta.exposedNames;
    // remove graphql // todo graphql from config
    delete toDbMeta.schemas.graphql;

    // getSqlFromMigrationObj diff with actions
    this.migrationObject = migrationObject.createFromTwoDbMetaObjects(this.fromDbMeta, this.toDbMeta);

    return sqlObjFromMigrationObject.getSqlFromMigrationObj(this.migrationObject, this.toDbMeta, renameInsteadOfDrop);
  }

  public getViewsSql() {
    return createViewsFromDbMeta(this.toDbMeta, 'appuserhugo', false);
  }

  public getBootSql() {

    const bootSql = [];

    const paths = fastGlob.sync(`${__dirname}/boot_scripts/*.sql`, {
      deep: true,
      onlyFiles: true,
    });

    // load content
    for (const filePath of paths) {
      const filePathStr = filePath.toString();
      bootSql.push(fs.readFileSync(filePathStr, 'utf8'));
    }

    return bootSql;
  }

  public async migrate(fromDbMeta: IDbMeta,
                       toDbMeta: IDbMeta,
                       renameInsteadOfDrop: boolean = true): Promise<void> {

    // get DB pgClient from DI container
    const dbClient = this.dbAppClient.pgClient;

    // init DB
    await this.initDb();

    // get migration statements
    const migrationSqlStatements = this.getMigrationSqlStatements(fromDbMeta, toDbMeta, renameInsteadOfDrop);

    // get previous migration and compare to current
    const previousMigrationRow: any = (await dbClient.query(`SELECT state FROM _meta.migrations ORDER BY created_at DESC LIMIT 1;`)).rows[0];
    const  previousMigrationStateJSON = (previousMigrationRow == null) ? {} : previousMigrationRow.state;

    // anything to migrate and not the same as last time?
    if (diff(previousMigrationStateJSON, toDbMeta) != null) {

      // get view statements
      const viewsSqlStatements = this.getViewsSql();

      // run DB migrations
      try {
        // create transaction
        this.logger.trace('migration.begin');
        await dbClient.query('BEGIN');

        // run migration sql
        for (const sql of Object.values(migrationSqlStatements)) {
          this.logger.trace('migration.sql.statement', sql);
          await  dbClient.query(sql);
        }

        // create views based on DB
        for (const sql of Object.values(viewsSqlStatements)) {
          this.logger.trace('migration.view.sql.statement', sql);
          await  dbClient.query(sql);
        }

        // current framework db version
        const dbVersion: string = (await dbClient.query(`SELECT value FROM _meta.info WHERE key = 'version';`)).rows[0].value;

        // last step, save final dbMeta in _meta
        this.logger.trace('migration.state.saved');
        await dbClient.query(`INSERT INTO "_meta"."migrations"(version, state) VALUES($1,$2)`, [dbVersion, toDbMeta]);

        // commit
        this.logger.trace('migration.commit');
        await dbClient.query('COMMIT');
      } catch (err) {
        // rollback
        this.logger.warn('migration.rollback');
        await dbClient.query('ROLLBACK');
        throw err;
      }
    }

    // run boot sql script every time - independent, no transaction
    const bootSqlStatements = this.getBootSql();
    for (const sql of Object.values(bootSqlStatements)) {
      this.logger.trace('migration.boot.sql.statement', sql);
      await  dbClient.query(sql);
    }

  }

  // boot and load all extensions
  private async boot(): Promise<void> {
    // load all extensions
    Object.values(this.extensionsPaths).forEach((path) => {
      require(path);
    });
  }

}
