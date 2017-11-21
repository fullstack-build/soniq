// MTM through Arrays https://medium.com/@leshchuk/mtm-on-arrays-in-postgresql-a97f3c50b8c6

import * as fastGlob from 'fast-glob';
import { readFile } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);

import { IDatabaseObject } from './IDatabaseObject';

export async function getMigrationsUp(pMigrationsPath: string, pMigrationDate?: number): Promise<string[]> {
    const migrationDate = pMigrationDate || (new Date()).getTime();

    // get latest migration before migrationDate
    try {

      const files = await fastGlob.default(
        `${pMigrationsPath}/*.json`,
        { deep: true, onlyFiles: true });

      // check if files are available
      if (files.length === 0) {
        throw new Error('migration.file.not.found');
      }

      // sort files
      files.sort();

      // find relevant migartion file
      const relevantMigartionFilePath = files.reduce((relevantFile, currentPath) => {
        const versionId = parseInt(basename(currentPath, '.json'), 10);
        return (versionId <= migrationDate) ? currentPath : relevantFile;
      });

      const databaseObject = require(relevantMigartionFilePath);
      return createSqlFromTableObjects(databaseObject);

    } catch (err) {
      throw err;
    }

  }

export function createSqlFromTableObjects(databaseObject: IDatabaseObject): string[] {

  const sqlCommands: string[] = [];

  // iterate over database tables
  Object.values(databaseObject.tables).map((tableObject) => {
    // only parse those with isDbModel = true
    if (!!tableObject.isDbModel) {
      createSqlFromTableObject(sqlCommands, tableObject);
    }
  });

  // todo create relations

  return sqlCommands;

}

function createSqlFromTableObject(sqlCommands, pTableObject) {

  // create table statement
  sqlCommands.push(`CREATE TABLE "${pTableObject.schemaName}.${pTableObject.tableName}"();`);

  // create column statements
  for (const field of pTableObject.fields) {

    if (field.type === 'computed') {
      // ignore computed
    } else if (field.type === 'relation') {
      // ignore relations
    } else {
      const fieldStatementArray = [];
      fieldStatementArray.push(
        `ALTER TABLE "${pTableObject.schemaName}.${pTableObject.tableName}"` +
         `ADD COLUMN "${field.name}"`);

      // add type
      fieldStatementArray.push(field.type);

      // constraints

      // primary key
      if (!!field.constraints.isPrimaryKey) {
        fieldStatementArray.push('PRIMARY KEY');
      }

      // unique
      if (!!field.constraints.unique) {
        fieldStatementArray.push('UNIQUE');
      }

      // not null
      if (!!field.constraints.nullable) {
        fieldStatementArray.push('NOT NULL');
      }

      // add end of statement
      fieldStatementArray.push(';');

      const fieldStatementStr = fieldStatementArray.join(' ');
      sqlCommands.push(fieldStatementStr);
    }
  }
}
