require("dotenv").config();
import { $core } from "./main";
import { Logger } from "soniq";
import { app } from "./app";
import { dev } from "./app/envs/dev";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const logger: Logger = $core.getLogger("Deployment");

  logger.info("Deploy Application...");

  await $core.deployApp(app, dev);

  logger.info("Finish");

  // logger.info("DEF", JSON.stringify($gql.getColumnExtensionPropertySchemas(), null, 2));
})();
