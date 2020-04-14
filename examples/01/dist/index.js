"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const core_1 = require("@fullstack-one/core");
const $core = core_1.Container.get("@fullstack-one/core");
(async () => {
    await $core.boot();
    fullstackLogsExample();
    //debugTraceExample();
})();
function fullstackLogsExample() {
    const logger = new core_1.Logger("test");
    logger.info("Hello World.");
    console.trace("Hello Trace.");
    test();
    function test() {
        console.error("foo");
        console.warn("test", {
            asks: [
                { price: "1000", amt: 10 },
                { price: "2000", amt: 10 },
            ],
            bids: [
                { price: "500", amt: 10 },
                { price: "100", amt: 10 },
            ],
        }, "huhu", "haha");
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
//# sourceMappingURL=index.js.map