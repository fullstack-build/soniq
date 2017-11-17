import * as fastGlob from 'fast-glob';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
import { parse } from 'graphql';

import { IDatabaseObject } from './IDatabaseObject';
import { parseGraphQlJsonNode } from './parser';

export namespace graphQlHelper {

  export const loadGraphQlSchema = async (pattern: string) => {

    try {

      const files = await fastGlob.default(pattern, { deep: false, onlyFiles: true });

      const readFilesPromises = [];
      files.map((filePath) => {
        readFilesPromises.push(readFileAsync(filePath, 'utf8'));
      });

      return await Promise.all(readFilesPromises);
    } catch (err) {

      throw err;
    }
  };

  export const parseGraphQlSchema = (graphQlSchema) => {
    try {
      return parse(graphQlSchema, { noLocation: true, noSource: true });
    } catch (err) {
      throw err;
    }

  };

  export const parseGraphQlJsonSchemaToTableObject = (graphQlJsonSchema): IDatabaseObject => {
    const databaseObject: IDatabaseObject = {};
    parseGraphQlJsonNode(graphQlJsonSchema, databaseObject);
    return databaseObject;
  };

  export const writeTableObjectIntoMigrationsFolder = async (migrationsPath: string,
                                                             tableObject: IDatabaseObject) => {
    const timestampMigration = migrationsPath + (new Date()).getTime() + '.json';
    try {
      await writeFileAsync(timestampMigration, JSON.stringify(tableObject, null, 2), 'utf8');
    } catch (err) {
      throw err;
    }

  };

}
