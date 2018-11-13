"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsePermission_1 = require("./parsePermission");
const extensions_1 = require("./extensions");
const createSchemaBasics_1 = require("./createSchemaBasics");
const createMutation_1 = require("./createMutation");
function parsePermissions(permissions, context, extensions, config) {
    const meta = {
        query: {},
        mutation: {},
        permissionMeta: {}
    };
    // TODO: Dustin: evaluate: context.gqlDocument = [...context.gqlDocument, ...createSchemaBasics()];
    createSchemaBasics_1.createSchemaBasics().forEach((d) => context.gqlDocument.definitions.push(d));
    const sql = [];
    // TODO: Dustin: same story... evaluate: context.gqlDocument = [...context.gqlDocument, ...createSchemaBasics()];
    const currentExtensions = extensions.slice().concat(extensions_1.extensions.slice());
    permissions.forEach((permission) => {
        const result = parsePermission_1.parsePermission(permission, context, currentExtensions, config);
        meta.query = Object.assign({}, meta.query, result.meta.query);
        meta.mutation = Object.assign({}, meta.mutation, result.meta.mutation);
        meta.permissionMeta = Object.assign({}, meta.permissionMeta, result.meta.permissionMeta);
        result.sql.forEach((q) => sql.push(q));
        context.gqlDocument = result.gqlDocument;
    });
    const modifiedMutation = {};
    // Loop over mutations to modify them by extensions (e.g. add input arguments)
    Object.values(meta.mutation).forEach((mutation) => {
        const extendArguments = [];
        let myMutation = mutation;
        currentExtensions.forEach((parser) => {
            if (parser.modifyMutation != null) {
                const result = parser.modifyMutation(myMutation);
                if (result != null) {
                    if (result.extendArguments != null && Array.isArray(result.extendArguments)) {
                        result.extendArguments.forEach((argument) => {
                            extendArguments.push(argument);
                        });
                    }
                    if (result.mutation) {
                        myMutation = result.mutation;
                    }
                }
            }
        });
        const gqlMutation = createMutation_1.createMutation(myMutation.name, myMutation.gqlReturnTypeName, myMutation.gqlInputTypeName, extendArguments);
        context.gqlDocument.definitions.push(gqlMutation);
        modifiedMutation[myMutation.name] = mutation;
    });
    meta.mutation = modifiedMutation;
    // Loop over extensions to add definitions
    currentExtensions.forEach((parser) => {
        if (parser.extendDefinitions != null) {
            const definitions = parser.extendDefinitions(context.gqlDocument, meta, sql);
            if (definitions != null && Array.isArray(definitions)) {
                definitions.forEach((definition) => {
                    context.gqlDocument.definitions.push(definition);
                });
            }
        }
    });
    return {
        gqlDocument: JSON.parse(JSON.stringify(context.gqlDocument)),
        meta,
        sql
    };
}
exports.parsePermissions = parsePermissions;
