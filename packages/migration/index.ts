import * as _ from 'lodash';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';

import * as One from '../core';
import { migrationObject } from './migrationObject';

import { sqlArray } from './sqlArray';

export class Migration extends One.AbstractPackage {

  private readonly fromDbMeta: One.IDbMeta;
  private readonly toDbMeta: One.IDbMeta;
  private readonly migrationObject: One.IDbMeta;

  constructor(fromDbMeta: One.IDbMeta,
              toDbMeta: One.IDbMeta) {
    super();

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

  public getMigrationDbMeta(): One.IDbMeta {
    return _.cloneDeep(this.migrationObject);
  }

  public async initDb(): void {

    const loadSuffixOrder = ['extension', 'schema', 'table', 'function', 'insert', 'set', 'select', 'operator_class'];
    // will try, but ignore any errors
    const optinalSuffix = ['operator_class'];
    const loadFilesOrder  = {};
    for (const suffix of loadSuffixOrder) {
      const paths = fastGlob.sync(`${__dirname}/init_scripts/*/*.${suffix}.sql`, {
        deep: true,
        onlyFiles: true,
      });

      // load content
      for (const filePath of paths) {
        loadFilesOrder[suffix] = loadFilesOrder[suffix] || [];
        loadFilesOrder[suffix][filePath] = fs.readFileSync(filePath, 'utf8');
      }
    }

    // send statements to DB
    const dbClient = this.$one.getDbSetupClient();

    try {
      // create transaction
      await dbClient.query('BEGIN');

      // run migration sql
      for (const suffix of loadSuffixOrder) {

        for (const entry of Object.entries(loadFilesOrder[suffix])) {
          const path = entry[0];
          const statement = entry[1];
          try {
            this.logger.trace('migration.init.db.file', path);

            await  dbClient.query(statement, null);
          } catch (err) {
            // check if an optional query failed
            if (optinalSuffix.includes(suffix)) {
              // tslint:disable-next-line:no-console
              console.error('* optional statement failed', suffix, path, err);
            } else {
              // actual error -> rollback
              // tslint:disable-next-line:no-console
              console.error('* actual error', suffix, path, err);
              throw err;
            }
          }
        }
      }

      // commit
      await dbClient.query('COMMIT');
    } catch (err) {
      // roll-back
      await dbClient.query('ROLLBACK');
      throw err;
    }

  }

  public getMigrationSqlStatements(renameInsteadOfDrop: boolean = true): string[] {
    return sqlArray.getSqlFromMigrationObj(this.migrationObject, this.toDbMeta, renameInsteadOfDrop);
  }

  public async migrate(renameInsteadOfDrop: boolean = true): Promise<void> {
    const migrationSqlStatements = this.getMigrationSqlStatements(renameInsteadOfDrop);

    // anything to migrate?
    if (migrationSqlStatements.length > 0) {
      const dbClient = this.$one.getDbSetupClient();

      // init DB
      await this.initDb();

      try {
        // create transaction
        await dbClient.query('BEGIN');

        // run migration sql
        for (const sql of Object.values(migrationSqlStatements)) {
          this.logger.trace('migration.sql.statement', sql);
          await  dbClient.query(sql);
        }

        // last step, save final dbMeta in _meta
        await dbClient.query(`INSERT INTO "_meta"."migrations"(state) VALUES($1)`, [this.toDbMeta]);

        // commit
        await dbClient.query('COMMIT');
      } catch (err) {
        // roll-back
        await dbClient.query('ROLLBACK');
        throw err;
      }
    }
  }

}
