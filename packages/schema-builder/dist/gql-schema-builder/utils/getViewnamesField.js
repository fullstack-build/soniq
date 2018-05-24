"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getViewnamesField(typesEnumName) {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: '_viewnames'
        },
        arguments: [],
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
                            value: typesEnumName
                        }
                    }
                }
            }
        },
        directives: []
    };
}
exports.default = (typesEnumName) => {
    return getViewnamesField(typesEnumName);
};
