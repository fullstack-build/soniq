import { ISchemaExtension } from "../ISchemaExtension";
import { IDbSchema, IDbFunction } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgSelector } from "../../helpers";

// tslint:disable-next-line:no-var-requires
const crypto = require("crypto");

function sha1(input) {
  return crypto
    .createHash("sha1")
    .update(input)
    .digest("hex");
}

const FUNCTIONS_QUERY = `
SELECT routine_name "name", specific_schema "schema", obj_description(to_regproc('"' || specific_schema || '"."' || routine_name || '"'), 'pg_proc') "comment"
FROM information_schema.routines
WHERE routine_type = 'FUNCTION' AND $1 @> ARRAY[specific_schema::text];
`;

export interface IPgFunction {
  name: string;
  schema: string;
  comment: string | null;
  hash: string | null;
}

const getFunctions = async (dbClient: PoolClient, schemas: string[]): Promise<IPgFunction[]> => {
  const { rows } = await dbClient.query(FUNCTIONS_QUERY, [schemas]);

  return rows.map((row) => {
    let hash = null;
    if (row.comment != null) {
      const splittedComment = row.comment.split("_");
      if (splittedComment[0] === "ONE" && splittedComment[1] != null) {
        hash = splittedComment[1];
      }
    }

    return {
      ...row,
      hash
    };
  });
};

// Replaced "currentFunctions: IPgFunction[] | IDbFunction[]" with "currentFunctions: any" because of stupid ts errors
const getFunctionsByRegClass = (currentFunctions: any) => {
  const currentFunctionsByName = {};

  currentFunctions.forEach((currentFunction: IPgFunction | IDbFunction) => {
    currentFunctionsByName[getFunctionRegClass(currentFunction)] = currentFunction;
  });

  return currentFunctionsByName;
};

const getFunctionRegClass = (fn: IPgFunction | IDbFunction): string => {
  return `${getPgSelector(fn.schema)}.${getPgSelector(fn.name)}`;
};

export const schemaExtensionFunctions: ISchemaExtension = {
  generateCommands: async (schema: IDbSchema, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };
    const functions = schema.functions || [];

    const currentFunctions = await getFunctions(dbClient, schema.schemas);
    const currentFunctionsByName = getFunctionsByRegClass(currentFunctions);
    const functionsByName = getFunctionsByRegClass(functions);

    // Find Functions to delete
    currentFunctions.forEach((currentFunction) => {
      if (functionsByName[getFunctionRegClass(currentFunction)] == null) {
        // Delete it
        result.commands.push({
          sqls: [`DROP FUNCTION ${getFunctionRegClass(currentFunction)};`],
          operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 100
        });
      }
    });

    // Find Functions to add and change
    functions.forEach((fn) => {
      if (schema.schemas.indexOf(fn.schema) < 0) {
        result.errors.push({
          message: `The schema of a function with name '${fn.name}' is not managed by One. (Schema: '${fn.name}').`
        });
        return;
      }

      const functionRegClass = getFunctionRegClass(fn);
      const position = fn.runAfterTables === true ? OPERATION_SORT_POSITION.ALTER_COLUMN : OPERATION_SORT_POSITION.CREATE_SCHEMA;
      if (currentFunctionsByName[functionRegClass] != null) {
        // Update it
        if (currentFunctionsByName[functionRegClass].hash == null || currentFunctionsByName[functionRegClass].hash !== sha1(fn.definition)) {
          // We do not drop functions, since it could be required somewhere.
          // This however, forbids to change input parameters
          /* result.commands.push({
            sqls: [`DROP FUNCTION ${getFunctionRegClass(fn)};`],
            operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 100
          }); */

          result.commands.push({
            sqls: [fn.definition, `COMMENT ON FUNCTION ${functionRegClass} IS 'ONE_${sha1(fn.definition)}_Your comment';`],
            operationSortPosition: position + 100
          });
        }
      } else {
        // Create it
        result.commands.push({
          sqls: [fn.definition, `COMMENT ON FUNCTION ${functionRegClass} IS 'ONE_${sha1(fn.definition)}_Your comment';`],
          operationSortPosition: position + 100
        });
      }
    });

    return result;
  }
};
