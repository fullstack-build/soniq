"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getViewnamesArgument(typesEnumName) {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: 'viewnames'
        },
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
        },
        defaultValue: null,
        directives: []
    };
}
exports.default = (extendArguments) => {
    return (typesEnumName, name) => {
        let args = [
            getViewnamesArgument(typesEnumName)
        ];
        if (extendArguments != null) {
            let newArguments = [];
            extendArguments.forEach((extendArgument) => {
                newArguments = newArguments.concat(extendArgument(typesEnumName, name));
            });
            args = args.concat(newArguments);
        }
        return args;
    };
};
