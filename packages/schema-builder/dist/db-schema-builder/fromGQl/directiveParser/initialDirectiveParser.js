"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const gQlAstToDbMetaHelper_1 = require("../gQlAstToDbMetaHelper");
const utils = require("../../../gql-schema-builder/utils");
const index_1 = require("./index");
const { parseDirectiveArguments } = utils;
// ignore table, just make it available
index_1.registerDirectiveParser('table', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // nothing to do here -> has been done in ObjectTypeDefinition
});
// mark as computed
index_1.registerDirectiveParser('computed', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'computed';
});
// mark as customResolver
index_1.registerDirectiveParser('custom', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'customResolver';
});
// add unique constraint
index_1.registerDirectiveParser('unique', (gQlDirectiveASTNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    let constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_key`;
    // named unique constraint - override
    if (gQlDirectiveASTNode.arguments[0] != null && gQlDirectiveASTNode.arguments[0].name.value === 'name') {
        const namedConstraintName = gQlDirectiveASTNode.arguments[0].value.value;
        constraintName = `${refDbMetaCurrentTable.name}_${namedConstraintName}_key`;
    }
    gQlAstToDbMetaHelper_1.createConstraint(constraintName, 'UNIQUE', {}, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
});
// native PG check constraint
index_1.registerDirectiveParser('check', (gQlDirectiveASTNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // iterate over all constraints
    gQlDirectiveASTNode.arguments.forEach((argument) => {
        const checkName = argument.name.value;
        const constraintName = `${refDbMetaCurrentTable.name}_${checkName}_check`;
        const options = {
            param1: argument.value.value
        };
        // create constraint
        gQlAstToDbMetaHelper_1.createConstraint(constraintName, 'CHECK', options, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    });
});
// embedded json types -> jsonb
index_1.registerDirectiveParser('json', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'jsonb';
});
// override type with PG native type
index_1.registerDirectiveParser('type', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const customType = _.get(gQlDirectiveNode, 'arguments[0].value.value');
    // assume everything unknown by GraphQL is a custom type
    dbMetaNode.type = 'customType';
    dbMetaNode.customType = customType;
    /*
    // detect known PG types
    switch (customType) {
        case 'Date':
            dbMetaNode.type = 'date';
            break;
      case 'timestamp':
        dbMetaNode.type = 'timestamp';
        break;
        default:
            dbMetaNode.type = 'customType';
            dbMetaNode.customType = customType;
            break;
    }
    */
});
// set default value
index_1.registerDirectiveParser('default', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    gQlAstToDbMetaHelper_1.setDefaultValueForColumn(gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
});
// add special migration
index_1.registerDirectiveParser('migrate', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    gQlAstToDbMetaHelper_1.addMigration(gQlDirectiveNode, dbMetaNode, refDbMeta);
});
