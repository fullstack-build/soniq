"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_parse_resolve_info_1 = require("graphql-parse-resolve-info");
function resolveCreateMutation(query, mutation) {
    const fieldNames = Object.keys(query.args.input);
    const fieldValues = Object.values(query.args.input);
    const values = [];
    // Generate fields which will be inserted
    const f = fieldNames.map((name) => {
        return `"${name}"`;
    }).join(', ');
    // Generate values to be inserted
    const v = fieldValues.map((value) => {
        values.push(value);
        return '$' + values.length;
    }).join(', ');
    // Build insert query
    return { sql: `INSERT INTO "${mutation.viewSchemaName}"."${mutation.viewName}" (${f}) VALUES (${v}) RETURNING id`,
        values,
        mutation,
        id: query.args.input.id
    };
}
function resolveUpdateMutation(query, mutation) {
    const fieldNames = Object.keys(query.args.input);
    const fieldValues = Object.values(query.args.input);
    const setFields = [];
    const values = [];
    let entityId = null;
    Object.keys(query.args.input).forEach((fieldName) => {
        const fieldValue = query.args.input[fieldName];
        if (fieldName !== 'id') {
            // Add field to update set list and it's value to values
            values.push(fieldValue);
            setFields.push(`"${fieldName}" = $${values.length}`);
        }
        else {
            // If field is id use it as entity identifier
            entityId = fieldValue;
        }
    });
    // add id to values to match it
    values.push(entityId);
    // Build update by id query
    return { sql: `UPDATE "${mutation.viewSchemaName}"."${mutation.viewName}" SET ${setFields.join(', ')} WHERE id = $${values.length} RETURNING id`,
        values,
        mutation,
        id: query.args.input.id
    };
}
function resolveDeleteMutation(query, mutation) {
    // Build delete by id query
    return { sql: `DELETE FROM "${mutation.viewSchemaName}"."${mutation.viewName}" WHERE id = $1 RETURNING id`,
        values: [query.args.input.id],
        mutation,
        id: query.args.input.id
    };
}
function getMutationResolver(gQlTypes, dbObject, mutations) {
    const mutationsByName = {};
    // Make object by names from array
    Object.values(mutations).forEach((mutation) => {
        mutationsByName[mutation.name] = mutation;
    });
    return (obj, args, context, info) => {
        // Use PostGraphile parser to get nested query objeect
        const query = graphql_parse_resolve_info_1.parseResolveInfo(info);
        // Get mutation informations from generated Schema-data
        const mutation = mutationsByName[query.name];
        // Switch mutation type
        switch (mutation.type) {
            case 'CREATE':
                return resolveCreateMutation(query, mutation);
            case 'UPDATE':
                return resolveUpdateMutation(query, mutation);
            case 'DELETE':
                return resolveDeleteMutation(query, mutation);
            default:
                throw new Error('Mutation-Type does not exist! "' + mutation.type + '"');
        }
    };
}
exports.getMutationResolver = getMutationResolver;
