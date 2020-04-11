require("dotenv").config();

import { Container, Core } from "@fullstack-one/core";

const $core: Core = Container.get("@fullstack-one/core");

(async () => {
  await $core.boot();

  console.log("Hello World.");
})();
