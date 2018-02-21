"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return {
        kind: 'InputObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: 'SqlQuery'
        },
        directives: [],
        fields: [{
                kind: 'InputValueDefinition',
                name: {
                    kind: 'Name',
                    value: 'text'
                },
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: 'String'
                    }
                },
                defaultValue: null,
                directives: []
            },
            {
                kind: 'InputValueDefinition',
                name: {
                    kind: 'Name',
                    value: 'values'
                },
                type: {
                    kind: 'ListType',
                    type: {
                        kind: 'NamedType',
                        name: {
                            kind: 'Name',
                            value: 'String'
                        }
                    }
                },
                defaultValue: null,
                directives: []
            }
        ]
    };
};
