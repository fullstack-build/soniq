import { IDbSchema, IDbTable } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgRegClass, ONE_PREFIX } from "../../helpers";
import { ITableExtension, IHelpersWithColumnHelper } from "../ITableExtension";
import { getChecks, ICheck } from "./queryHelper";

export const ONE_CHECK_PREFIX = `${ONE_PREFIX}CHECK_`;

export const tableExtenstionChecks: ITableExtension = {
  preloadData: async (schema: IDbSchema, dbClient: PoolClient): Promise<ICheck[]> => {
    const checks = await getChecks(dbClient, schema.schemas);
    return checks;
  },
  generateCommands: async (
    table: IDbTable,
    dbSchema: IDbSchema,
    checks: ICheck[],
    helpers: IHelpersWithColumnHelper,
    dbClient: PoolClient
  ): Promise<IGqlMigrationResult> => {
    const result: IGqlMigrationResult = {
      errors: [],
      warnings: [],
      commands: []
    };

    const tableChecks = table.checks || [];
    const proceededCheckIds = [];

    tableChecks.forEach((check) => {
      const idValidation = helpers.validateId(check.id);

      if (idValidation != null) {
        result.errors.push({
          message: `ID of check ${check.id} is invalid: ${idValidation}.`,
          meta: {
            tableId: table.id
          }
        });
      }

      if (check.definition == null || typeof check.definition !== "string") {
        result.errors.push({
          message: `Field 'definition' of check ${check.id} is invalid. It has to be a string.`,
          meta: {
            tableId: table.id
          }
        });
      }
    });

    if (result.errors.length > 0) {
      return result;
    }

    checks.forEach((existingCheck) => {
      let foundInSchema: any = false;

      tableChecks.forEach((check) => {
        const constraintName = createConstraintName(check.id);

        if (existingCheck.constraint_name === constraintName) {
          proceededCheckIds.push(check.id);
          foundInSchema = true;

          // Check if check-definition has changed
          if (existingCheck.definition !== createCheckDefinition(check.definition)) {
            result.commands.push({
              sqls: [
                `ALTER TABLE ${getPgRegClass(
                  table
                )} DROP CONSTRAINT "${constraintName}", ADD CONSTRAINT "${constraintName}" CHECK ${createCheckDefinition(check.definition)};`
              ],
              operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
              autoSchemaFixes: [
                {
                  tableId: table.id,
                  checkId: check.id,
                  key: "definition",
                  value: existingCheck.definition
                }
              ]
            });
          }
        }
      });

      if (foundInSchema !== true) {
        result.commands.push({
          sqls: [`ALTER TABLE ${getPgRegClass(table)} DROP CONSTRAINT "${existingCheck.constraint_name}";`],
          operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN - 100
        });
      }
    });

    tableChecks.forEach((check) => {
      if (proceededCheckIds.indexOf(check.id) < 0) {
        result.commands.push({
          sqls: [
            `ALTER TABLE ${getPgRegClass(table)} ADD CONSTRAINT "${createConstraintName(check.id)}" CHECK ${createCheckDefinition(check.definition)};`
          ],
          operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN + 100
        });
      }
    });

    return result;
  }
};

const createConstraintName = (checkId: string): string => {
  return `${ONE_CHECK_PREFIX}${checkId}`;
};

const createCheckDefinition = (checkDefinition: string): string => {
  if (checkDefinition[0] !== "(" && checkDefinition[checkDefinition.length - 1] !== ")") {
    return `(${checkDefinition})`;
  }
  return checkDefinition;
};
