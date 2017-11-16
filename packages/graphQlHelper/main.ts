import * as fastGlob from 'fast-glob';
import { readFile } from 'fs';
import { isArray, promisify } from 'util';
const readFileAsync = promisify(readFile);
import { parse } from 'graphql';

import { ITableObjects } from './ITableObjects';
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

  export const parseGraphQlJsonSchemaToTableObject = (graphQlJsonSchema): ITableObjects => {
    const tableObjects: ITableObjects = {};
    parseGraphQlJsonNode(tableObjects, graphQlJsonSchema);
    return tableObjects;
  };

}
