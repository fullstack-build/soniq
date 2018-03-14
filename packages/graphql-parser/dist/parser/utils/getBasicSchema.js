"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getQueryArguments_1 = require("./getQueryArguments");
const getMutationArguments_1 = require("./getMutationArguments");
const createSqlQueryInput_1 = require("./createSqlQueryInput");
function getMutation(name, inputType, viewsEnumName, returnType) {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: name,
        },
        arguments: getMutationArguments_1.default(viewsEnumName, inputType),
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: returnType,
            },
        },
        directives: [],
    };
}
function getQuery(name, type, viewsEnumName) {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: name,
        },
        arguments: getQueryArguments_1.default(viewsEnumName),
        type: {
            kind: 'NonNullType',
            type: {
                kind: 'ListType',
                type: {
                    kind: 'NonNullType',
                    type: {
                        kind: 'NamedType',
                        name: {
                            kind: 'Name',
                            value: type,
                        },
                    },
                },
            },
        },
        directives: [],
    };
}
exports.default = (queries, mutations) => {
    const queryFields = [];
    Object.values(queries).forEach((query) => {
        queryFields.push(getQuery(query.name, query.type, query.viewsEnumName));
    });
    const mutationFields = [];
    Object.values(mutations).forEach((mutation) => {
        mutationFields.push(getMutation(mutation.name, mutation.inputType, mutation.viewsEnumName, mutation.returnType));
    });
    const definitions = [];
    definitions.push({
        kind: 'SchemaDefinition',
        directives: [],
        operationTypes: [{
                kind: 'OperationTypeDefinition',
                operation: 'query',
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: 'Query',
                    },
                },
            },
            {
                kind: 'OperationTypeDefinition',
                operation: 'mutation',
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: 'Mutation',
                    },
                },
            }
        ],
    });
    definitions.push({
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: 'Query',
        },
        interfaces: [],
        directives: [],
        fields: queryFields,
    });
    definitions.push({
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: 'Mutation',
        },
        interfaces: [],
        directives: [],
        fields: mutationFields,
    });
    definitions.push(createSqlQueryInput_1.default());
    return definitions;
};
