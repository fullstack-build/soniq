import { IMigrationResultWithFixes, IObjectTrace, ICommand } from "./interfaces";
import { Logger } from "..";

function addSpaces(str: string, numb: number): string {
  while (str.length < numb) {
    str += " ";
  }
  return str;
}

export function printMigrationResultSummary(result: IMigrationResultWithFixes): void {
  let color: string = "\u001b[0m";

  const commands: string = addSpaces(result.commands.length.toString(), 5);
  const warnings: string = addSpaces(result.warnings.length.toString(), 5);
  const errors: string = addSpaces(result.errors.length.toString(), 5);

  if (result.commands.length > 0) {
    color = "\u001b[34;1m";
  }
  console.log(color + `  ${commands} Command${result.commands.length === 1 ? "" : "s"}`);
  color = "\u001b[0m";

  if (result.warnings.length > 0) {
    color = "\u001b[33;1m";
  }
  console.log(color + `  ${warnings} Warning${result.warnings.length === 1 ? "" : "s"}`);
  color = "\u001b[0m";

  if (result.errors.length > 0) {
    color = "\u001b[31;1m";
  }
  console.log(color + `  ${errors} Error${result.errors.length === 1 ? "" : "s"}`);
  color = "\u001b[0m";
}

export function printMigrationResult(
  result: IMigrationResultWithFixes,
  objectTraces: IObjectTrace[],
  logger: Logger
): void {
  console.log("\n\u001b[34;1m MIGRATION:");
  console.log("\u001b[34;1m ____________________________________________________________________\n");

  if (
    result.errors.length < 1 &&
    result.commands.length < 1 &&
    result.warnings.length < 1 &&
    result.autoAppConfigFixes.length < 1
  ) {
    console.log("\u001b[30;1m Nothing to do.");
  }

  if (result.errors.length < 1 && result.commands.length > 0) {
    console.log(`\u001b[34;1m${result.warnings.length} COMMANDS\n`);

    result.commands.forEach((command: ICommand, index) => {
      console.log(
        `\u001b[34;1mCOMMAND [${index + 1}/${result.commands.length}] has ${command.sqls.length} SQL-Commands`
      );

      command.sqls.forEach((sql, subIndex) => {
        if (sql.startsWith(`INSERT INTO "_core"."Migrations"`) !== true) {
          console.log(`\u001b[0m-> [${subIndex}/${command.sqls.length}]`, "\u001b[0m", sql);
        } else {
          console.log(
            `\u001b[0m-> [${subIndex}/${command.sqls.length}]`,
            "\u001b[0m",
            "This system-internal command is hidden bacause of it's size."
          );
        }
      });
    });

    console.log("\n");
  }

  if (result.errors.length > 0) {
    console.log(`\u001b[31;1m${result.errors.length} ERRORS`);

    result.errors.forEach((error, index) => {
      console.log(`\n\u001b[31;1mERR [${index + 1}/${result.errors.length}]`, "\u001b[0m", error.message);
      console.log("=>", error);
      if (error.objectId != null) {
        for (const objectTrace of objectTraces) {
          if (objectTrace.objectId === error.objectId) {
            logger.prettyError(objectTrace.trace, undefined, undefined, undefined, 1, 1);
          }
        }
      }
      if (error.error != null) {
        logger.prettyError(error.error, true, false, false);
      }
      if (error.command != null) {
        logger.info("Happend while running this command: ", error.command);
      }
    });
    console.log("\n");
  }

  if (result.warnings.length > 0) {
    console.log(`\u001b[33;1m${result.warnings.length} WARNINGS`);

    result.warnings.forEach((warning, index) => {
      console.log(`\n\u001b[33;1mWARN [${index + 1}/${result.warnings.length}]`, "\u001b[0m", warning.message);
      if (warning.objectId != null) {
        for (const objectTrace of objectTraces) {
          if (objectTrace.objectId === warning.objectId) {
            logger.prettyError(objectTrace.trace, undefined, undefined, undefined, 1, 1);
          }
        }
      }
      if (warning.error != null) {
        logger.prettyError(warning.error);
      }
    });
    console.log("\n");
  }

  if (result.autoAppConfigFixes != null && result.autoAppConfigFixes.length > 0) {
    const fixesLength: number = result.autoAppConfigFixes.length;
    console.log(`\u001b[36;1m${fixesLength} AUTO-FIXES`);

    result.autoAppConfigFixes.forEach((autoFix, index) => {
      console.log(`\n\u001b[36;1mFIX [${index + 1}/${fixesLength}]`, "\u001b[0m", autoFix.message);
      if (autoFix.objectId != null) {
        for (const objectTrace of objectTraces) {
          if (objectTrace.objectId === autoFix.objectId) {
            logger.prettyError(objectTrace.trace, undefined, undefined, undefined, 1, 1);
          }
        }
      }
    });
  }

  console.log("\n\n\u001b[34;1m MIGRATION SUMMARY:");
  console.log("\u001b[34;1m ____________________________________________________________________\n");
  printMigrationResultSummary(result);
  console.log("");

  if (result.errors.length > 0) {
    console.log(`\u001b[31;1m The migration-generation finished with some errors.`);
    console.log(`\u001b[31;1m Your Application cannot be migrated.`);
  } else {
    if (result.warnings.length > 0) {
      console.log(`\u001b[33;1m The migration-generation finished with some warnings.`);
    }
    if (result.autoAppConfigFixes != null && result.autoAppConfigFixes.length > 0) {
      console.log(`\u001b[33;1m There are some auto-fixes you should apply.`);
    }
    if (result.commands.length > 0) {
      console.log(`\n\u001b[32;1m Your app can be migrated.`);
    } else {
      console.log(`\n\u001b[32;1m Nothing to deploy. Everything is fine.`);
    }
  }
  console.log("\u001b[34;1m ____________________________________________________________________\n");
}
