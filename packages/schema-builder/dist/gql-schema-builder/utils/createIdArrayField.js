"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createIdArrayField(fieldName, isNonNullType = false) {
    const field = {
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
    if (isNonNullType === true) {
        field.type = {
            kind: 'NonNullType',
            type: field.type
        };
    }
    return field;
}
exports.createIdArrayField = createIdArrayField;
