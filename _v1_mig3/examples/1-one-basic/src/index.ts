
import { $core, pgConfig } from "./main";

(async () => {
  console.log("Booting Application");

  await $core.boot(pgConfig);

  console.log("Booted Application");
})();