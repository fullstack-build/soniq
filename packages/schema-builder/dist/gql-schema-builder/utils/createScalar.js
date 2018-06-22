"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createScalar(name) {
    return {
        kind: 'ScalarTypeDefinition',
        name: {
            kind: 'Name',
            value: name,
        },
        directives: []
    };
}
exports.createScalar = createScalar;
