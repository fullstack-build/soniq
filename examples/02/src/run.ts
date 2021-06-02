/* require("dotenv").config();
import { dev } from "./app/envs/dev";
import { $core } from "./main";
import { Logger } from "soniq";

(() => {
  const logger: Logger = $core.getLogger("Example_02");

  logger.info("Booting Application");

  $core
    .boot(dev.getPgConfig())
    .then(() => {
      logger.info("Booted Application");
    })
    .catch((err) => {
      logger.fatal(err);
    });
})();
*/
