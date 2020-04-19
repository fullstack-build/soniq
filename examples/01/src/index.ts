require("dotenv").config();

import { Container, Core, Logger } from "soniq";

const $core: Core = Container.get("@soniq");

class ValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function soniqLogsExample(): void {
  const logger: Logger = $core.getLogger("testLogger");
  logger.silly("Log in a function");
  logger.silly("silly");
  logger.trace("trace");
  logger.debug("debug");
  logger.info("info");
  logger.warn("warn");
  logger.error("error");
  logger.fatal("FATAL!!!");

  logger.info(new ValidationError("Much error. Very danger."));

  logger.warn("Some fancy JS object", [
    { id: 1, email: "abc@def.gh", active: true },
    { id: 2, email: "abc@def.gh", active: false },
    {
      id: 3,
      email: "abc@def.gh",
      active: true,
    },
  ]);
  logger.error("***", new Error("bar"), "###");

  (function test() {
    logger.error("foo");

    console.log("CONSOLE LOG:");
    console.trace("console tracing");
    console.error("foo");
    console.warn("Some fancy JS object", [
      { id: 1, email: "abc@def.gh", active: true },
      { id: 2, email: "abc@def.gh", active: false },
      {
        id: 3,
        email: "abc@def.gh",
        active: true,
      },
    ]);
    console.debug("---------");
    console.error("***", new Error("bar"), "###");
  })();
}

$core
  .boot()
  .then(() => {
    soniqLogsExample();
  })
  .catch((err) => {
    console.error(err);
  });
