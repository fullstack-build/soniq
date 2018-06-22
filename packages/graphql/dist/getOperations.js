"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_builder_1 = require("@fullstack-one/schema-builder");
const { parseDirectives } = schema_builder_1.utils;
function getOperations(gqlDocument) {
    const queries = [];
    const mutations = [];
    const fields = [];
    Object.values(gqlDocument.definitions).forEach((node) => {
        if (node.kind === 'ObjectTypeExtension') {
            const type = node.name.value;
            Object.values(node.fields).forEach((field) => {
                const fieldName = field.name.value;
                const directives = parseDirectives(field.directives);
                if (directives.custom != null && directives.custom.resolver != null) {
                    const params = directives.custom.params || {};
                    if (type === 'Query') {
                        queries.push({
                            name: fieldName,
                            type,
                            resolver: directives.custom.resolver,
                            params
                        });
                    }
                    if (type === 'Mutation') {
                        mutations.push({
                            name: fieldName,
                            type,
                            resolver: directives.custom.resolver,
                            params
                        });
                    }
                }
            });
        }
        if (node.kind === 'ObjectTypeDefinition') {
            const gqlTypeName = node.name.value;
            Object.values(node.fields).forEach((field) => {
                const fieldName = field.name.value;
                const directives = parseDirectives(field.directives);
                if (directives.custom != null && directives.custom.resolver != null) {
                    const params = directives.custom.params || {};
                    fields.push({
                        name: fieldName,
                        type: 'FIELD',
                        gqlTypeName,
                        fieldName,
                        resolver: directives.custom.resolver,
                        params
                    });
                }
            });
        }
    });
    return {
        queries,
        mutations,
        fields
    };
}
exports.getOperations = getOperations;
