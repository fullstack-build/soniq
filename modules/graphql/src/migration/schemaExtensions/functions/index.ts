import { ISchemaExtension } from "../ISchemaExtension";
import { IDbSchema, IDbFunction } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgSelector } from "../../helpers";

import * as crypto from "crypto";

function sha1(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

const FUNCTIONS_QUERY: string = `
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

async function getFunctions(dbClient: PoolClient, schemas: string[]): Promise<IPgFunction[]> {
  const { rows } = await dbClient.query(FUNCTIONS_QUERY, [schemas]);

  return rows.map((row: IPgFunction) => {
    let hash: string | null = null;
    if (row.comment != null) {
      const splittedComment: string[] = row.comment.split("_");
      if (splittedComment[0] === "ONE" && splittedComment[1] != null) {
        hash = splittedComment[1];
      }
    }

    return {
      ...row,
      hash,
    };
  });
}

interface ICurrentPgFunctionsByName {
  [key: string]: IPgFunction;
}

interface ICurrentDbFunctionsByName {
  [key: string]: IDbFunction;
}

function getFunctionRegClass(fn: IPgFunction | IDbFunction): string {
  return `${getPgSelector(fn.schema)}.${getPgSelector(fn.name)}`;
}

// Replaced "currentFunctions: IPgFunction[] | IDbFunction[]" with "currentFunctions: any" because of stupid ts errors
function getFunctionsByRegClass(
  currentFunctions: IPgFunction[] | IDbFunction[]
): ICurrentPgFunctionsByName | ICurrentDbFunctionsByName {
  const currentFunctionsByName: ICurrentPgFunctionsByName | ICurrentDbFunctionsByName = {};

  currentFunctions.forEach((currentFunction: IPgFunction | IDbFunction) => {
    currentFunctionsByName[getFunctionRegClass(currentFunction)] = currentFunction;
  });

  return currentFunctionsByName;
}

export const schemaExtensionFunctions: ISchemaExtension = {
  generateCommands: async (schema: IDbSchema, dbClient: PoolClient): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: [],
    };
    const functions: IDbFunction[] = schema.functions || [];

    const currentFunctions: IPgFunction[] = await getFunctions(dbClient, schema.schemas);
    const currentFunctionsByName: ICurrentPgFunctionsByName = getFunctionsByRegClass(
      currentFunctions
    ) as ICurrentPgFunctionsByName;
    const functionsByName: ICurrentDbFunctionsByName = getFunctionsByRegClass(functions) as ICurrentDbFunctionsByName;

    // Find Functions to delete
    currentFunctions.forEach((currentFunction: IPgFunction) => {
      if (functionsByName[getFunctionRegClass(currentFunction)] == null) {
        // Delete it
        result.commands.push({
          sqls: [`DROP FUNCTION ${getFunctionRegClass(currentFunction)};`],
          operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 100,
        });
      }
    });

    // Find Functions to add and change
    functions.forEach((fn: IDbFunction) => {
      if (schema.schemas.indexOf(fn.schema) < 0) {
        result.errors.push({
          message: `The schema of a function with name '${fn.name}' is not managed by One. (Schema: '${fn.name}').`,
          objectId: `Function_"${fn.schema}"."${fn.name}"`,
        });
        return;
      }

      const functionRegClass: string = getFunctionRegClass(fn);
      const position: number =
        fn.runAfterTables === true ? OPERATION_SORT_POSITION.ALTER_COLUMN : OPERATION_SORT_POSITION.CREATE_SCHEMA;
      if (currentFunctionsByName[functionRegClass] != null) {
        // Update it
        if (
          currentFunctionsByName[functionRegClass].hash == null ||
          currentFunctionsByName[functionRegClass].hash !== sha1(fn.definition)
        ) {
          // We do not drop functions, since it could be required somewhere.
          // This however, forbids to change input parameters
          /* result.commands.push({
            sqls: [`DROP FUNCTION ${getFunctionRegClass(fn)};`],
            operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA - 100
          }); */

          result.commands.push({
            sqls: [
              fn.definition,
              `COMMENT ON FUNCTION ${functionRegClass} IS 'ONE_${sha1(fn.definition)}_Your comment';`,
            ],
            operationSortPosition: position + 100,
            objectId: `Function_"${fn.schema}"."${fn.name}"`,
          });
        }
      } else {
        // Create it
        result.commands.push({
          sqls: [
            fn.definition,
            `COMMENT ON FUNCTION ${functionRegClass} IS 'ONE_${sha1(fn.definition)}_Your comment';`,
          ],
          operationSortPosition: position + 100,
          objectId: `Function_"${fn.schema}"."${fn.name}"`,
        });
      }
    });

    return result;
  },
};
