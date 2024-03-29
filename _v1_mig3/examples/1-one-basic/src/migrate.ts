
import { $core, pgConfig, appConfig, $gql } from "./main";

(async () => {
  console.log("Generate Migration");
  const res = await $core.generateMigration("v" + Math.random(), appConfig, "development", pgConfig);

  console.log("Print Migration");
  $core.printMigrationResult(res);

  console.log("Apply Migration");
  await $core.applyMigrationResult(res, pgConfig);

  console.log("Finished Migration");

  // console.log("DEF", JSON.stringify($gql.getColumnExtensionPropertySchemas(), null, 2));
})();