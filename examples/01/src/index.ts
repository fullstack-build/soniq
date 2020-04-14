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
  logger.info(new ValidationError("ValidationError"));

  test();

  function test() {
    console.error("foo");
    console.warn(
      "test",
      [
        { id: 1, email: "abc@def.gh", active: true },
        { id: 2, email: "abc@def.gh", active: false },
        { id: 3, email: "abc@def.gh", active: true },
      ],
      "huhu",
      "haha"
    );
    console.log("---------");
    console.error("***", new Error("bar"), "###");
  }
}

function debugTraceExample() {
  require("debug-trace")({
    colors: {
      warn: "35",
      info: "32",
    },
  });

  console.info("Hello World.");

  test();

  function test() {
    console.error("foo");
    console.warn(JSON.stringify({ a: { b: { c: true } } }, null, 2));
    console.log("---------");
    console.trace("huhu haha");
    console.log("---------");
    console.error(new Error("bar"));
  }
}
