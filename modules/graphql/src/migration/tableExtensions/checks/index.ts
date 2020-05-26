import { IDbSchema, IDbTable, IDbCheck } from "../../DbSchemaInterface";
import { PoolClient, OPERATION_SORT_POSITION } from "soniq";
import { IGqlMigrationResult } from "../../interfaces";
import { getPgRegClass, ONE_PREFIX } from "../../helpers";
import { ITableExtension, IHelpersWithColumnHelper } from "../ITableExtension";
import { getChecks, ICheck } from "./queryHelper";

export const ONE_CHECK_PREFIX: string = `${ONE_PREFIX}CHECK_`;

function createConstraintName(checkId: string): string {
  return `${ONE_CHECK_PREFIX}${checkId}`;
}

function createCheckDefinition(checkDefinition: string): string {
  if (checkDefinition[0] !== "(" && checkDefinition[checkDefinition.length - 1] !== ")") {
    return `(${checkDefinition})`;
  }
  return checkDefinition;
}

export const tableExtenstionChecks: ITableExtension = {
  preloadData: async (schema: IDbSchema, dbClient: PoolClient): Promise<ICheck[]> => {
    const checks: ICheck[] = await getChecks(dbClient, schema.schemas);
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
      commands: [],
    };

    const tableChecks: IDbCheck[] = table.checks || [];
    const proceededCheckIds: string[] = [];

    tableChecks.forEach((check: IDbCheck) => {
      const idValidation: string | null = helpers.validateId(check.id);

      if (idValidation != null) {
        result.errors.push({
          message: `ID of check ${check.id} is invalid: ${idValidation}.`,
          meta: {
            tableId: table.id,
            checkId: check.id,
          },
          objectId: check.id,
        });
      }

      if (check.definition == null || typeof check.definition !== "string") {
        result.errors.push({
          message: `Field 'definition' of check ${check.id} is invalid. It has to be a string.`,
          meta: {
            tableId: table.id,
            checkId: check.id,
          },
          objectId: check.id,
        });
      }
    });

    if (result.errors.length > 0) {
      return result;
    }

    checks.forEach((existingCheck: ICheck) => {
      let foundInSchema: unknown = false;

      tableChecks.forEach((check: IDbCheck) => {
        const constraintName: string = createConstraintName(check.id);

        if (existingCheck.constraint_name === constraintName) {
          proceededCheckIds.push(check.id);
          foundInSchema = true;

          // Check if check-definition has changed
          if (existingCheck.definition !== createCheckDefinition(check.definition)) {
            result.commands.push({
              sqls: [
                `ALTER TABLE ${getPgRegClass(
                  table
                )} DROP CONSTRAINT "${constraintName}", ADD CONSTRAINT "${constraintName}" CHECK ${createCheckDefinition(
                  check.definition
                )};`,
              ],
              operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN,
              autoSchemaFixes: [
                {
                  tableId: table.id,
                  checkId: check.id,
                  key: "definition",
                  value: existingCheck.definition,
                  message: `Please change the definition of check "${check.id}" to "${existingCheck.definition}".`,
                },
              ],
              objectId: check.id,
            });
          }
        }
      });

      if (foundInSchema !== true) {
        result.commands.push({
          sqls: [`ALTER TABLE ${getPgRegClass(table)} DROP CONSTRAINT "${existingCheck.constraint_name}";`],
          operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN - 100,
        });
      }
    });

    tableChecks.forEach((check: IDbCheck) => {
      if (proceededCheckIds.indexOf(check.id) < 0) {
        result.commands.push({
          sqls: [
            `ALTER TABLE ${getPgRegClass(table)} ADD CONSTRAINT "${createConstraintName(
              check.id
            )}" CHECK ${createCheckDefinition(check.definition)};`,
          ],
          operationSortPosition: OPERATION_SORT_POSITION.ALTER_COLUMN + 100,
          objectId: check.id,
        });
      }
    });

    return result;
  },
};
