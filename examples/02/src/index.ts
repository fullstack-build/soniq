require("dotenv").config();
import { pgConfig } from "./db";
import { $core } from "./main";
import { Logger } from "soniq";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const logger: Logger = $core.getLogger("Example_02");

  logger.info("Booting Application");

  await $core.boot(pgConfig);

  logger.info("Booted Application");
})();
