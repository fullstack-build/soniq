require("dotenv").config();

import { Container, Core, Logger } from "@fullstack-one/core";

const $core: Core = Container.get("@fullstack-one/core");

(async () => {
  await $core.boot();

  fullstackLogsExample();
  //debugTraceExample();
})();

class ValidationError extends Error {
  constructor(message: any) {
    super(message); // (1)
    this.name = "ValidationError"; // (2)
  }
}

function fullstackLogsExample() {
  const logger = new Logger("test");
  logger.info("Hello World.");
  console.trace("Hello Trace.");

  logger.warn(new Error("huhu haha"));
  logger.info("davor", new ValidationError("ValidationError"), "danach");

  test();

  function test() {
    logger.error("foo");
    logger.warn(
      "test",
      [
        { id: 1, email: "abc@def.gh", active: true },
        { id: 2, email: "abc@def.gh", active: false },
        { id: 3, email: "abc@def.gh", active: true },
      ],
      "huhu",
      "haha"
    );
    logger.debug("---------");
    logger.error("***", new Error("bar"), "###");
  }
}
