"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });

if (process.env.FULLSTACK_ONE_DEV === 'true') {
  __export(require("./lib/index.ts"));
} else {
  __export(require("./dist/lib/index.js"));
}
