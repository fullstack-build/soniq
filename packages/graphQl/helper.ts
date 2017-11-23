import * as fastGlob from 'fast-glob';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
import { parse, print } from 'graphql';

import { IDatabaseObject } from '../core/IDatabaseObject';
import { parseGraphQlJsonNode } from './bootParser';

export namespace graphQl.helper {

  export const loadFilesByGlobPattern = async (pattern: string) => {
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

  export const requireFilesByGlobPattern = async (pattern: string) => {
    try {
      const files = await fastGlob.default(pattern, { deep: false, onlyFiles: true });

      const requiredFiles = [];
      files.map((filePath) => {
        let requiredFileContent: any = null;
        try {
          const requiredFile = require(filePath);
          requiredFileContent = requiredFile.default != null ? requiredFile.default : requiredFile;
        } catch (err) {
          throw err;
        }

        requiredFiles.push(requiredFileContent);
      });

      return requiredFiles;
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

  export const printGraphQlDocument = (gQlDocument: any): string => {
    try {
      return print(gQlDocument);
    } catch (err) {
      throw err;
    }
  };

  export const parseGraphQlJsonSchemaToDbObject = (graphQlJsonSchema): IDatabaseObject => {
    const databaseObject: IDatabaseObject = {
      tables: {},
      relations: {},
    };
    parseGraphQlJsonNode(graphQlJsonSchema, databaseObject);
    // return copy instead of ref
    return { ...databaseObject };
  };

  export const writeTableObjectIntoMigrationsFolder = async (
    migrationsPath: string,
    tableObject: IDatabaseObject,
    migrationId?: number,
  ) => {
    // create name for migration
    const timestampMigration =
      migrationsPath + (migrationId || new Date().getTime()) + '.json';

    try {
      return await writeFileAsync(
        timestampMigration,
        JSON.stringify(tableObject, null, 2),
        'utf8',
      );
    } catch (err) {
      throw err;
    }
  };
}
