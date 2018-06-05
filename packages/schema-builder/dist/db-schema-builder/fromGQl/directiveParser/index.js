"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// object with all directive parser
const directiveParser = {};
// register directive parser
function registerDirectiveParser(directiveNameInLowerCase, fn) {
    directiveParser[directiveNameInLowerCase] = fn;
}
exports.registerDirectiveParser = registerDirectiveParser;
// return currently registered parser
function getDirectiveParser(directiveName) {
    return (directiveName != null) ? directiveParser[directiveName] : directiveParser;
}
exports.getDirectiveParser = getDirectiveParser;
