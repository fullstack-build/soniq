"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classifyUserDefinitions_1 = require("./classifyUserDefinitions");
const createPublicSchema_1 = require("./createPublicSchema");
// import createPublicSchemaNew from './createPublicSchemaNew';
const getCustomOperations_1 = require("./getCustomOperations");
function runtimeParser(userSchema, views, expressions, dbObject, viewSchemaName) {
    const classification = classifyUserDefinitions_1.default(userSchema);
    // const oldData = createPublicSchema(classification, views, expressions, dbObject, viewSchemaName);
    // fs.writeFileSync(__dirname + '/1.json', JSON.stringify(oldData, null, 2), 'utf8');
    // const newData = createPublicSchemaNew(classification, views, expressions, dbObject, viewSchemaName);
    // fs.writeFileSync(__dirname + '/2.json', JSON.stringify(newData, null, 2), 'utf8');
    const { document, dbViews, gQlTypes, queries, mutations, customFields } = createPublicSchema_1.default(classification, views, expressions, dbObject, viewSchemaName);
    // console.log(JSON.stringify(document, null, 2));
    // console.log(JSON.stringify(dbViews, null, 2));
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
