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
  logger.silly("Log in a function");
  logger.silly("silly");
  logger.trace("trace");
  logger.debug("debug");
  logger.info("info");
  logger.warn("warn");
  logger.error("error");

  //logger.warn(new Error("huhu haha"));
  logger.info(new ValidationError("Much error. Very danger."));

  test();

  function test() {
    logger.error("foo");
    logger.warn("Some fancy JS object", [
      { id: 1, email: "abc@def.gh", active: true },
      { id: 2, email: "abc@def.gh", active: false },
      { id: 3, email: "abc@def.gh", active: true },
    ]);
    logger.debug("---------");
    logger.error("***", new Error("bar"), "###");
  }
}
