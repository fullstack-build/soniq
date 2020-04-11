"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const core_1 = require("@fullstack-one/core");
const $core = core_1.Container.get("@fullstack-one/core");
(async () => {
    await $core.boot();
    console.log("Hello World.");
})();
