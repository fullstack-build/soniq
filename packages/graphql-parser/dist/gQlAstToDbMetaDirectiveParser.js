"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const gQlAstToDbMeta_1 = require("./gQlAstToDbMeta");
const gQlAstToDbMetaHelper_1 = require("./gQlAstToDbMetaHelper");
// ignore table, just make it available
gQlAstToDbMeta_1.registerDirectiveParser('table', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // nothing to do here -> has been done in ObjectTypeDefinition
});
// mark as computed
gQlAstToDbMeta_1.registerDirectiveParser('computed', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'computed';
});
// mark as customResolver
gQlAstToDbMeta_1.registerDirectiveParser('custom', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'customResolver';
});
// add unique constraint
gQlAstToDbMeta_1.registerDirectiveParser('unique', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    gQlAstToDbMetaHelper_1.addConstraint('UNIQUE', gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
});
// native PG check constraint
gQlAstToDbMeta_1.registerDirectiveParser('check', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // iterate over all constraints
    gQlDirectiveNode.arguments.forEach((argument) => {
        gQlAstToDbMetaHelper_1.addConstraint('CHECK', argument, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    });
});
// validate constraint
gQlAstToDbMeta_1.registerDirectiveParser('validate', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // iterate over all constraints
    gQlDirectiveNode.arguments.forEach((argument) => {
        gQlAstToDbMetaHelper_1.addConstraint('validate', argument, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    });
});
// embedded json types -> jsonb
gQlAstToDbMeta_1.registerDirectiveParser('json', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'jsonb';
});
// override type with PG native type
gQlAstToDbMeta_1.registerDirectiveParser('type', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const customType = _.get(gQlDirectiveNode, 'arguments[0].value.value');
    // detect known PG types
    switch (customType) {
        case 'Date':
            dbMetaNode.type = 'date';
            break;
        default:
            dbMetaNode.type = 'customType';
            dbMetaNode.customType = customType;
            break;
    }
});
// set default value
gQlAstToDbMeta_1.registerDirectiveParser('default', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    gQlAstToDbMetaHelper_1.setDefaultValueForColumn(gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
});
// add special miration
gQlAstToDbMeta_1.registerDirectiveParser('migrate', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    gQlAstToDbMetaHelper_1.addMigration(gQlDirectiveNode, dbMetaNode, refDbMeta);
});
// versioning
gQlAstToDbMeta_1.registerDirectiveParser('versioning', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.versioning = {
        isActive: true
    };
});
// nonUpdatable
gQlAstToDbMeta_1.registerDirectiveParser('nonupdatable', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.immutable = {
        isUpdatable: false
    };
});
// immutable
gQlAstToDbMeta_1.registerDirectiveParser('immutable', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.immutable = {
        isUpdatable: false,
        isDeletable: false
    };
});
