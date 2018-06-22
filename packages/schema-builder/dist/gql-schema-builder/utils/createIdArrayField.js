"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createIdArrayField(fieldName) {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: fieldName
        },
        arguments: [],
        type: {
            kind: 'ListType',
            type: {
                kind: 'NonNullType',
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: 'ID',
                    },
                },
            },
        },
        directives: []
    };
}
exports.createIdArrayField = createIdArrayField;
