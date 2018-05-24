"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
exports.default = (classification) => {
    const customQueries = [];
    const customMutations = [];
    Object.values(classification.otherDefinitions).forEach((node) => {
        if (node.kind === 'ObjectTypeExtension') {
            const type = node.name.value;
            Object.values(node.fields).forEach((field) => {
                const fieldName = field.name.value;
                const customDirectiveIndex = utils_1.findDirectiveIndex(field, 'custom');
                if (customDirectiveIndex > -1) {
                    const customDirective = field.directives[customDirectiveIndex];
                    const directiveArguments = utils_1.parseDirectiveArguments(customDirective);
                    const resolverName = directiveArguments.resolver;
                    const params = directiveArguments.params || {};
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
