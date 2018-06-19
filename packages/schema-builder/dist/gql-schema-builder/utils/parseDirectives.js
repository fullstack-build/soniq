"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseDirectiveArguments_1 = require("./parseDirectiveArguments");
function parseDirectives(directives) {
    const directivesObject = {};
    directives.forEach((directive) => {
        directivesObject[directive.name.value] = parseDirectiveArguments_1.parseDirectiveArguments(directive);
    });
    return directivesObject;
}
exports.parseDirectives = parseDirectives;
