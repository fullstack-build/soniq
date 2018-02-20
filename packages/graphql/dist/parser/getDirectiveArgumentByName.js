"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (directive, argumentName) => {
    Object.values(directive.arguments || []).forEach((argument) => {
        if (argument.name.value === argumentName) {
            return argument;
        }
    });
    return null;
};
