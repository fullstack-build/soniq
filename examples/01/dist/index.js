"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const soniq_1 = require("soniq");
const $core = soniq_1.Container.get("@soniq");
(async () => {
    await $core.boot();
    soniqLogsExample();
    //debugTraceExample();
})();
class ValidationError extends Error {
    constructor(message) {
        super(message); // (1)
        this.name = "ValidationError"; // (2)
    }
}
function soniqLogsExample() {
    const logger = $core.getLogger("testLogger");
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
    test();
    function test() {
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
    }
}
//# sourceMappingURL=index.js.map