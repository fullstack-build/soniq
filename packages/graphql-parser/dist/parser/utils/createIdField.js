"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (fieldName) => {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: fieldName
        },
        arguments: [],
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: 'ID'
            }
        },
        directives: []
    };
};
