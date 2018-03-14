"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classifyUserDefinitions_1 = require("./classifyUserDefinitions");
const createPublicSchema_1 = require("./createPublicSchema");
const getCustomOperations_1 = require("./getCustomOperations");
const jsonParser = require("./mods/json");
const idParser = require("./mods/id");
const computedParser = require("./mods/computed");
const customParser = require("./mods/custom");
const relationParser = require("./mods/relation");
const defaultParser = require("./mods/default");
const viewnamesParser = require("./mods/viewnames");
const expressionsParser = require("./mods/expressions");
const mutationsParser = require("./mods/mutations");
const parsers = [
    jsonParser,
    idParser,
    computedParser,
    customParser,
    relationParser,
    defaultParser,
    viewnamesParser,
    expressionsParser,
    mutationsParser
];
function runtimeParser(userSchema, views, expressions, dbObject, viewSchemaName, customParsers) {
    const currentParsers = parsers.slice().concat(customParsers.slice());
    const classification = classifyUserDefinitions_1.default(userSchema);
    const { document, dbViews, gQlTypes, queries, mutations, customFields } = createPublicSchema_1.default(classification, views, expressions, dbObject, viewSchemaName, currentParsers);
    const { customQueries, customMutations } = getCustomOperations_1.default(classification);
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
