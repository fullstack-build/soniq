"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getInputArgument(gqlInputTypeName) {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: 'input'
        },
        type: {
            kind: 'NonNullType',
            type: {
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: gqlInputTypeName
                }
            }
        },
        defaultValue: null,
        directives: []
    };
}
function createMutationArguments(gqlInputTypeName) {
    return [
        getInputArgument(gqlInputTypeName)
    ];
}
exports.createMutationArguments = createMutationArguments;
