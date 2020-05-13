require("dotenv").config();
import { pgConfig } from "./db";
import { appConfig } from "./appConfig";
import { $core } from "./main";
import { Logger, IMigrationResultWithFixes } from "soniq";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const logger: Logger = $core.getLogger("Migration");

  logger.info("Generate Migration");

  const res: IMigrationResultWithFixes = await $core.generateMigration(
    "v" + Math.random(),
    appConfig,
    "development",
    pgConfig
  );

  logger.info("Print Migration");

  $core.printMigrationResult(res);

  logger.info("Apply Migration");

  await $core.applyMigrationResult(res, pgConfig);

  logger.info("Finished Migration");

  // logger.info("DEF", JSON.stringify($gql.getColumnExtensionPropertySchemas(), null, 2));
})();
