"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getLimitArgument() {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: 'limit'
        },
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: 'Int'
            }
        },
        defaultValue: null,
        directives: []
    };
}
function getOffsetArgument() {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: 'offset'
        },
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: 'Int'
            }
        },
        defaultValue: null,
        directives: []
    };
}
function getWhereArgument(gqlTypeName) {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: 'where'
        },
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: `${gqlTypeName}Filter`
            }
        },
        defaultValue: null,
        directives: []
    };
}
function getOrderByArgument(gqlTypeName) {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: 'orderBy'
        },
        type: {
            kind: 'ListType',
            type: {
                kind: 'NonNullType',
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: `${gqlTypeName}OrderBy`,
                    }
                }
            }
        },
        defaultValue: null,
        directives: []
    };
}
function getQueryArguments(gqlTypeName) {
    return [
        getWhereArgument(gqlTypeName),
        getOrderByArgument(gqlTypeName),
        getLimitArgument(),
        getOffsetArgument()
    ];
}
exports.getQueryArguments = getQueryArguments;
