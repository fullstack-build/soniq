"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (node, directiveName) => {
    return Object.entries(node.directives).findIndex((element) => {
        const directive = element[1];
        return (directive.name.value === directiveName);
    });
};
