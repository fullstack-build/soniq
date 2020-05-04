require("dotenv").config();
import { Server } from "@soniq/server";
import { Container, Core, Logger } from "soniq";

const $core: Core = Container.get(Core);
Container.get(Server);

/*  tslog example START * /
class MyClass {
  private readonly _logger: Logger = new Logger({ displayInstanceName: false });

  public constructor() {
    this._logger.silly("I am a silly log.");
  }

  public myMethod(): void {
    const jsonObj: object = {
      name: "John Doe",
      age: 30,
      cars: {
        car1: "Audi",
        car2: "BMW",
        car3: "Tesla",
      },
    };
    this._logger.debug("I am a debug log.");
    this._logger.info("I am an info log.");
    this._logger.warn("I am a warn log with a json object:", jsonObj);
    this._logger.error("I am an error log.");
    this._logger.debug(new Promise((resolve, reject) => {}));
    log.fatal("I am a fatal log.");
    try {
      // @ts-ignore
      null.foo();
    } catch (err) {
      log.fatal(err);
    }
  }
}

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

    process.stdout.write("\n\n\n\n");
    // const myClass: MyClass = new MyClass();
    //  myClass.myMethod();
  })();
}
*/
const log: Logger = new Logger();
log.silly("I am a silly log.");
log.trace("I am a trace log with a stack trace.");
log.debug("I am a debug log.");
log.info("I am an info log.");
log.warn("I am a warn log with a json object:", { foo: "bar" });
log.error("I am an error log.");
log.fatal("I am a fatal log.");
try {
  // @ts-ignore
  undefined.f();
} catch (err) {
  log.fatal(err);
}
/* tslog example END */

$core
  .boot()
  .then(() => {
    // soniqLogsExample();
  })
  .catch((err) => {
    console.error(err);
  });
