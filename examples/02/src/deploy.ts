require("dotenv").config();
import { $core } from "./main";
import { app } from "./app";
import { dev } from "./app/envs/dev";

(async () => {
  await $core.deployApp(app, dev);
})().catch((err) => {
  console.error("ERROR", err);
});
