"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classifyUserDefinitions_1 = require("./classifyUserDefinitions");
const createPublicSchema_1 = require("./createPublicSchema");
const getCustomOperations_1 = require("./getCustomOperations");
function runtimeParser(userSchema, views, expressions, dbObject, viewSchemaName) {
    const classification = classifyUserDefinitions_1.default(userSchema);
    const { document, dbViews, gQlTypes, queries, mutations, customFields } = createPublicSchema_1.default(classification, views, expressions, dbObject, viewSchemaName);
    const { customQueries, customMutations } = getCustomOperations_1.default(classification);
    // console.log(customQueries, customMutations, customFields)
    // console.log('doc', JSON.stringify(document, null, 2));
    // console.log(print(document), views, viewFusions);
    // console.log(print(document));
    /* console.log('> NEW GQL:');
    console.log(print(document));
    console.log('>');
    console.log('> ===================================================');
    console.log('>'); // */
    // console.log('> Views:', JSON.stringify(views, null, 2));
    // console.log('> Views:', JSON.stringify(views, null, 2));
    return { document, dbViews, gQlTypes, queries, mutations, customFields, customQueries, customMutations };
}
exports.runtimeParser = runtimeParser;
