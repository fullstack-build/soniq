import * as fastGlob from 'fast-glob';
import { readFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);
import { parse } from 'graphql';

import { ITableObject } from './ITableObject';

export namespace graphQlHelper {

  export const loadGraphQlSchemas = async (pattern: string) => {

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

  export const graphQlJsonSchemasToDbMigration = (graphQlJsonSchemas) => {
    const schemas = graphQlJsonSchemas.definitions;
    parseGraphQlJsonSchema(schemas[2]);

    return null;
  };

  const parseGraphQlJsonSchema = (graphQlJsonSchema) => {

    const tableObject: ITableObject = {
      tableName: graphQlJsonSchema.name.value,
      description: '',
      fields: [],
    };

    // create fields
    tableObject.fields = graphQlJsonSchema.fields.map();

    for (const fieldGraphQlJSON of ) {
      const fieldMigrations = buildFieldObject(tableObject.tableName, fieldGraphQlJSON);
      if (fieldMigrations != null) {
        tableObject.fields.push(fieldMigrations);
      }
    }

    // console.log(tableObject);

  };

}
