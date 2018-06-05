"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queryParser = [];
function registerQueryParser(callback) {
    queryParser.push(callback);
}
exports.registerQueryParser = registerQueryParser;
// return all registered parser
function getQueryParser() {
    return queryParser;
}
exports.getQueryParser = getQueryParser;
