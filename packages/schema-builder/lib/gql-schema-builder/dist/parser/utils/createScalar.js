"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (name) => {
    return {
        kind: 'ScalarTypeDefinition',
        name: {
            kind: 'Name',
            value: name,
        },
        directives: []
    };
};
