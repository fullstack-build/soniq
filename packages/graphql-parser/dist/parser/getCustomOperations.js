"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getArgumentByName_1 = require("./getArgumentByName");
const findDirectiveIndex_1 = require("./findDirectiveIndex");
const parseObjectArgument_1 = require("./parseObjectArgument");
exports.default = (classification) => {
    const customQueries = [];
    const customMutations = [];
    Object.values(classification.otherDefinitions).forEach((node) => {
        if (node.kind === 'TypeExtensionDefinition') {
            const type = node.definition.name.value;
            Object.values(node.definition.fields).forEach((field) => {
                const fieldName = field.name.value;
                const customDirectiveIndex = findDirectiveIndex_1.default(field, 'custom');
                if (customDirectiveIndex > -1) {
                    const customDirective = field.directives[customDirectiveIndex];
                    const resolverName = getArgumentByName_1.default(customDirective, 'resolver').value.value;
                    const paramsNode = getArgumentByName_1.default(customDirective, 'params');
                    let params = {};
                    if (paramsNode != null) {
                        params = parseObjectArgument_1.default(paramsNode);
                    }
                    if (type === 'Query') {
                        customQueries.push({
                            name: fieldName,
                            type,
                            resolver: resolverName,
                            params
                        });
                    }
                    if (type === 'Mutation') {
                        customMutations.push({
                            name: fieldName,
                            type,
                            resolver: resolverName,
                            params
                        });
                    }
                }
            });
        }
    });
    return {
        customQueries,
        customMutations
    };
};
