"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createIdField(fieldName, isNonNullType = false) {
    const field = {
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
    if (isNonNullType === true) {
        field.type = {
            kind: 'NonNullType',
            type: field.type
        };
    }
    return field;
}
exports.createIdField = createIdField;
