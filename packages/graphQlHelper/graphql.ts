import * as fastGlob from 'fast-glob';
import { readFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);
import { parse } from 'graphql';

export namespace graphQlHelper {

  export const loadSchemas = async (pattern: string) => {

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

  export const parseSchema = (graphQlSchema) => {
    try {
      return parse(graphQlSchema, { noLocation: true, noSource: true });
    } catch (err) {
      throw err;
    }

  };

  export const schemaToDbMigration = (graphQlSchema) => {

    // console.log('#', graphQlSchema);

    return graphQlSchema;
  };

}
