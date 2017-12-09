// MTM through Arrays https://medium.com/@leshchuk/mtm-on-arrays-in-postgresql-a97f3c50b8c6
import { readFile } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);

import { helper } from '../core';

/*
export async function getMigrationsUp(
  pMigrationsPath: string,
  pMigrationDate?: number,
): Promise<string[]> {
  const migrationDate = pMigrationDate || new Date().getTime();

  // get latest migration before migrationDate
  try {
    const files = await helper.loadFilesByGlobPattern(`${pMigrationsPath}/*.json`);

    // check if files are available
    if (files.length === 0) {
      throw new Error('migration.file.not.found');
    }

    // sort files
    files.sort();

    // find relevant migartion file
    const relevantMigartionFilePath = files.reduce(
      (relevantFile, currentPath) => {
        const versionId = parseInt(basename(currentPath, '.json'), 10);
        return versionId <= migrationDate ? currentPath : relevantFile;
      },
    );

    const databaseObject = require(relevantMigartionFilePath);
    return createSqlFromDbObject(databaseObject);
  } catch (err) {
    throw err;
  }
}*/
