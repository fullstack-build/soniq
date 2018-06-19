"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createMutationArguments_1 = require("./createMutationArguments");
function createMutation(name, gqlTypeName, gqlInputTypeName, extendArguments) {
    return {
        kind: 'ObjectTypeExtension',
        name: {
            kind: 'Name',
            value: 'Mutation'
        },
        interfaces: [],
        directives: [],
        fields: [
            {
                kind: 'FieldDefinition',
                description: {
                    kind: 'StringValue',
                    value: ``,
                    block: true
                },
                name: {
                    kind: 'Name',
                    value: name
                },
                arguments: createMutationArguments_1.createMutationArguments(gqlInputTypeName).concat(extendArguments),
                type: {
                    kind: 'NonNullType',
                    type: {
                        kind: 'NamedType',
                        name: {
                            kind: 'Name',
                            value: gqlTypeName
                        }
                    }
                },
                directives: [
                    {
                        kind: 'Directive',
                        name: {
                            kind: 'Name',
                            value: 'custom'
                        },
                        arguments: [
                            {
                                kind: 'Argument',
                                name: {
                                    kind: 'Name',
                                    value: 'resolver'
                                },
                                value: {
                                    kind: 'StringValue',
                                    value: '@fullstack-one/graphql/mutationResolver',
                                    block: false
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    };
}
exports.createMutation = createMutation;
