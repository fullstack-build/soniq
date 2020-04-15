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
    var _a;
    const logger = new soniq_1.Logger((_a = $core.ENVIRONMENT) === null || _a === void 0 ? void 0 : _a.nodeId, "testLogger");
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
//# sourceMappingURL=index.js.map