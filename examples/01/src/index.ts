require("dotenv").config();

import { Container, Core, Logger } from "soniq";

const $core: Core = Container.get("@soniq");

(async () => {
  await $core.boot();

  soniqLogsExample();
  //debugTraceExample();
})();

class ValidationError extends Error {
  constructor(message: any) {
    super(message); // (1)
    this.name = "ValidationError"; // (2)
  }
}

function soniqLogsExample() {
  const logger = new Logger($core.ENVIRONMENT?.nodeId, "testLogger");
  logger.silly("Log in a function");
  logger.silly("silly");
  logger.trace("trace");
  logger.debug("debug");
  logger.info("info");
  logger.warn("warn");
  logger.error("error");

  logger.info(new ValidationError("Much error. Very danger."));

  test();

  function test() {
    logger.error("foo");
    logger.warn("Some fancy JS object", [
      { id: 1, email: "abc@def.gh", active: true },
      { id: 2, email: "abc@def.gh", active: false },
      {
        id: 3,
        email: "abc@def.gh",
        active: true,
      },
    ]);
    logger.debug("---------");
    logger.error("***", new Error("bar"), "###");
  }
}
