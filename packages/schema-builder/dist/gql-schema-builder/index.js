"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classifyUserDefinitions_1 = require("./classifyUserDefinitions");
const createPublicSchema_1 = require("./createPublicSchema");
const getCustomOperations_1 = require("./getCustomOperations");
const parsers_1 = require("./parsers");
function gqlSchemaBuilder(userSchema, views, expressions, dbObject, viewSchemaName, customParsers) {
    const currentParsers = customParsers.slice().concat(parsers_1.parsers.slice());
    const classification = classifyUserDefinitions_1.default(userSchema);
    const { document, dbViews, gQlTypes, queries, mutations, customFields } = createPublicSchema_1.default(classification, views, expressions, dbObject, viewSchemaName, currentParsers);
    const { customQueries, customMutations } = getCustomOperations_1.default(classification);
    /* console.log('> NEW GQL:');
    console.log(print(document));
    console.log(JSON.stringify(document, null, 2));
    console.log('>');
    console.log('> ===================================================');
    console.log('>'); // */
    // console.log('> Views:', JSON.stringify(views, null, 2));
    // console.log('> Views:', JSON.stringify(views, null, 2));
    return { document, dbViews, gQlTypes, queries, mutations, customFields, customQueries, customMutations };
}
exports.gqlSchemaBuilder = gqlSchemaBuilder;
