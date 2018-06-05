"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const triggerParser = [];
function registerTriggerParser(callback) {
    triggerParser.push(callback);
}
exports.registerTriggerParser = registerTriggerParser;
// return currently registered parser
function getTriggerParser() {
    return triggerParser;
}
exports.getTriggerParser = getTriggerParser;
