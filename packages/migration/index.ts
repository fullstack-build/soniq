import * as _ from 'lodash';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';

import * as ONE from '../core';
import { migrationObject } from './migrationObject';
import createViewsFromDbMeta from './createViewsFromDbMeta';

import { sqlObjFromMigrationObject } from './createSqlObjFromMigrationObject';

@ONE.Service()
export class Migration {

  private readonly fromDbMeta: ONE.IDbMeta;
  private readonly toDbMeta: ONE.IDbMeta;
  private readonly migrationObject: ONE.IDbMeta;

  // DI
  private logger: ONE.ILogger;

  constructor(fromDbMeta: ONE.IDbMeta,
              toDbMeta: ONE.IDbMeta) {

    // create logger
    this.logger = ONE.Container.get(ONE.LoggerFactory).create('Migration');

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

  }

  public getMigrationDbMeta(): ONE.IDbMeta {
    return _.cloneDeep(this.migrationObject);
  }

  public async initDb(): Promise<void> {
    // get DB pgClient from DI container
    const dbClient = ONE.Container.get(ONE.DbAppClient).pgClient;

    // check latest version migrated
    let latestVersion = 0;
    try {
      const dbInitVersion = (await dbClient.query(`SELECT value FROM _meta.info WHERE key = 'version';`)).rows[0];

      if (dbInitVersion != null && dbInitVersion.value != null) {
        latestVersion = parseFloat(dbInitVersion.value);
        this.logger.debug('migration.db.init.version.detected', latestVersion);
      }
    } catch (err) {
      this.logger.info('migration.db.init.not.found');
    }

    // find init scripts to ignore
    let initFoldersToIgnore = [];
    if (latestVersion > 0) {
      const initFolders = fastGlob.sync(`${__dirname}/init_scripts/[0-9].[0-9]`, {
        deep: false,
        onlyDirs: true,
      });
      initFoldersToIgnore = initFolders.reduce((result, path) => {
        const pathVersion = parseFloat(path.split('/').pop());
        if (pathVersion <= latestVersion) {
          result.push(path + '/**');
        }
        return result;
      }, []);
    }

    const loadSuffixOrder = ['extension', 'schema', 'type', 'table', 'function', 'set', 'insert', 'select'];
    // will try, but ignore any errors
    const loadOptionalSuffixOrder = ['operator_class'];
    const loadFilesOrder  = {};
    for (const suffix of [...loadSuffixOrder, ...loadOptionalSuffixOrder]) {
      const paths = fastGlob.sync(`${__dirname}/init_scripts/[0-9].[0-9]/*/*.${suffix}.sql`, {
        ignore: initFoldersToIgnore,
        deep: true,
        onlyFiles: true,
      });

      // load content
      for (const filePath of paths) {
        loadFilesOrder[suffix] = loadFilesOrder[suffix] || [];
        loadFilesOrder[suffix][filePath] = fs.readFileSync(filePath, 'utf8');
      }
    }
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

  public getMigrationSqlStatements(renameInsteadOfDrop: boolean = true): string[] {
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
      bootSql.push(fs.readFileSync(filePath, 'utf8'));
    }

    return bootSql;
  }

  public async migrate(renameInsteadOfDrop: boolean = true): Promise<void> {

    // get DB pgClient from DI container
    const dbClient = ONE.Container.get(ONE.DbAppClient).pgClient;

    // init DB
    await this.initDb();

    // get migration statements
    const migrationSqlStatements = this.getMigrationSqlStatements(renameInsteadOfDrop);

    // anything to migrate?
    if (migrationSqlStatements.length > 0) {

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

        // last step, save final dbMeta in _meta
        this.logger.trace('migration.state.saved');
        await dbClient.query(`INSERT INTO "_meta"."migrations"(state) VALUES($1)`, [this.toDbMeta]);

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

}
