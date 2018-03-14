"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const _ = require("lodash");
const deepEqual = require("deep-equal");
const helper = require("./helper");
var migrationObject;
(function (migrationObject) {
    const ACTION_KEY = '$$action$$';
    let fromDbMeta = null;
    let toDbMeta = null;
    let migrationObj = null;
    function createFromTwoDbMetaObjects(pFromDbMeta, pToDbMeta) {
        // check if toDbMeta is empty -> Parsing error
        if (pToDbMeta == null || Object.keys(pToDbMeta).length === 0) {
            throw new Error(`Migration Error: Provided migration final state is empty.`);
        }
        // crete copy of objects
        // new
        fromDbMeta = _.cloneDeep(pFromDbMeta);
        // remove views and exposed names
        delete fromDbMeta.exposedNames;
        // old
        toDbMeta = _.cloneDeep(pToDbMeta);
        // remove views and exposed names
        delete toDbMeta.exposedNames;
        // remove graphql // todo
        delete toDbMeta.schemas.graphql;
        return migrationObj = _diffAndAddActions(fromDbMeta, toDbMeta);
    }
    migrationObject.createFromTwoDbMetaObjects = createFromTwoDbMetaObjects;
    function _splitActionFromNode(node = {}) {
        return helper.splitActionFromNode(ACTION_KEY, node);
    }
    function _diffAndAddActions(pFromDbMeta, pToDbMeta) {
        return iterateAndMark(pFromDbMeta, pToDbMeta, {});
        function iterateAndMark(recursiveFromDbMeta, recursiveToDbMeta, pResult, pFromObjParent = {}, pToObjParent = {}, pResultParent = {}) {
            // all keys
            const keys = _.union(Object.keys(recursiveFromDbMeta), Object.keys(recursiveToDbMeta));
            keys.map((key) => {
                if (recursiveToDbMeta[key] == null) {
                    // is not object -> copy value
                    if (!util_1.isObject(recursiveFromDbMeta[key])) {
                        // ignore empty
                        if (recursiveFromDbMeta[key] != null) {
                            pResult[key] = recursiveFromDbMeta[key];
                        }
                    }
                    else {
                        // mark node as "remove" continue recursively
                        pResult[key] = pResult[key] || {}; // getSqlFromMigrationObj node if not available
                        pResult[key][ACTION_KEY] = pResult[key][ACTION_KEY] || {};
                        pResult[key][ACTION_KEY].remove = true;
                        iterateAndMark(recursiveFromDbMeta[key], {}, pResult[key], recursiveFromDbMeta, recursiveToDbMeta, pResult);
                    }
                } /* only "to" */
                else if (recursiveFromDbMeta[key] == null) {
                    // is not object -> copy value
                    if (!util_1.isObject(recursiveToDbMeta[key])) {
                        // ignore empty
                        if (recursiveToDbMeta[key] != null) {
                            // copy value
                            pResult[key] = recursiveToDbMeta[key];
                        }
                    }
                    else {
                        // mark node as "add" continue recursively
                        pResult[key] = pResult[key] || {}; // getSqlFromMigrationObj node if not available
                        pResult[key][ACTION_KEY] = pResult[key][ACTION_KEY] || {};
                        pResult[key][ACTION_KEY].add = true;
                        iterateAndMark({}, recursiveToDbMeta[key], pResult[key], recursiveFromDbMeta, recursiveToDbMeta, pResult);
                    }
                } /* both sides */
                else {
                    // both sides not an object?
                    if (!util_1.isObject(recursiveFromDbMeta[key]) && !util_1.isObject(recursiveToDbMeta[key])) {
                        // not equal? -> use new value, mark parent as changed / otherwise ignore
                        if (recursiveFromDbMeta[key] !== recursiveToDbMeta[key]) {
                            pResult[key] = recursiveToDbMeta[key];
                            // parent "change"
                            pResult[ACTION_KEY] = pResult[ACTION_KEY] || {};
                            pResult[ACTION_KEY].change = true;
                        }
                        else {
                            // ignore equal values, but keep name
                            if (key === 'name') {
                                pResult[key] = recursiveToDbMeta[key];
                            }
                        }
                    }
                    else {
                        // getSqlFromMigrationObj empty node
                        pResult[key] = pResult[key] || {};
                        // compare old and new (first level) and mark as changed if not equal
                        const nodeDiff = helper.difference(helper.getPropertiesWithoutNested(recursiveToDbMeta[key], ['oldName', 'oldSchemaName']), helper.getPropertiesWithoutNested(recursiveFromDbMeta[key], ['oldName', 'oldSchemaName']));
                        if (Object.keys(nodeDiff).length > 0) {
                            // "change" detected, mark this node before continuing recursively
                            pResult[key][ACTION_KEY] = pResult[key][ACTION_KEY] || {};
                            pResult[key][ACTION_KEY].change = true;
                        }
                        // continue recursively
                        iterateAndMark(recursiveFromDbMeta[key], recursiveToDbMeta[key], pResult[key], recursiveFromDbMeta, recursiveToDbMeta, pResult);
                    }
                }
            });
            // adjust changes on dbMeta for migration
            _adjustDeltaDbMeta(pResult);
            // clean empty objects
            helper.cleanObject(pResult);
            return pResult;
        }
    }
    function _adjustDeltaDbMeta(pMigrationDbMeta) {
        // iterate schemas
        if (pMigrationDbMeta.schemas != null) {
            Object.entries(pMigrationDbMeta.schemas).map((schema) => {
                const schemaName = schema[0];
                const schemaDef = schema[1];
                // iterate tables
                if (schemaDef.tables != null) {
                    Object.entries(schemaDef.tables).map((table) => {
                        const tableName = table[0];
                        const tableDef = table[1];
                        // rename table?
                        if (tableDef.oldName != null || tableDef.oldSchemaName != null) {
                            _combineRenamedNodes(tableDef.oldSchemaName, tableDef.schemaName, tableDef.oldName, tableName, pMigrationDbMeta.schemas);
                        }
                        // iterate columns
                        if (tableDef.columns != null) {
                            Object.entries(tableDef.columns).map((column) => {
                                const columnName = column[0];
                                const columnDef = column[1];
                                // rename column?
                                if (columnDef.oldName != null) {
                                    _combineRenamedNodes(null, null, columnDef.oldName, columnName, tableDef.columns);
                                }
                            });
                        }
                    });
                }
            });
        }
        // iterate enums and adjust enums
        if (pMigrationDbMeta.enums != null) {
            Object.entries(pMigrationDbMeta.enums).map((enumEntry) => {
                const enumName = enumEntry[0];
                const enumDef = enumEntry[1];
                const enumValues = enumDef.values;
                const enumAction = enumDef[ACTION_KEY];
                const enumValuesAction = _splitActionFromNode(enumValues).action;
                // if enum or enum values action "change" => recreate (remove and add) enum type
                // override with enum values "to" and mark als remove and add
                if ((enumAction != null && enumAction.change) || (enumValuesAction != null && enumValuesAction.change)) {
                    enumDef.values = toDbMeta.enums[enumName].values;
                    enumDef[ACTION_KEY] = {
                        remove: true,
                        add: true
                    };
                    // mark columns as changed to force type cast to new enum type
                    const enumColumns = _splitActionFromNode(enumDef.columns).node;
                    Object.values(enumColumns).forEach((enumColumn) => {
                        // access column using enum
                        const enumColumnDefinitionMigration = pMigrationDbMeta.schemas[enumColumn.schemaName].tables[enumColumn.tableName].columns[enumColumn.columnName];
                        const enumColumnDefinitionTo = toDbMeta.schemas[enumColumn.schemaName].tables[enumColumn.tableName].columns[enumColumn.columnName];
                        enumColumnDefinitionMigration[ACTION_KEY] = enumColumnDefinitionMigration[ACTION_KEY] || {};
                        enumColumnDefinitionMigration[ACTION_KEY].change = true;
                        // keep needed type information from "to" state
                        enumColumnDefinitionMigration.type = enumColumnDefinitionTo.type;
                        enumColumnDefinitionMigration.customType = enumColumnDefinitionTo.customType;
                    });
                }
            });
        }
        function _combineRenamedNodes(oldSchemaName, newSchemaName, oldName, newName, parent) {
            let nodeFrom;
            let nodeTo;
            let nextParentFrom;
            let nextParentTo;
            // schemaName => is a table
            if (newSchemaName != null) {
                const schemaNameFrom = oldSchemaName || newSchemaName;
                const tableNameFrom = oldName || newName;
                // only proceed if not renamed yet
                if (parent[schemaNameFrom] != null && parent[schemaNameFrom].tables[tableNameFrom]) {
                    // find nodes in different schemas
                    nodeFrom = parent[schemaNameFrom].tables[tableNameFrom];
                    nodeTo = parent[newSchemaName].tables[newName];
                    // get next parent for old and new (could be different schemas)
                    nextParentFrom = parent[schemaNameFrom].tables;
                    nextParentTo = parent[newSchemaName].tables;
                }
            }
            else {
                nodeFrom = parent[oldName];
                nodeTo = parent[newName];
                // for column both parents are equal (tables can be in different schemas)
                nextParentFrom = parent;
                nextParentTo = parent;
            }
            // does the original still exist
            if (nodeFrom == null && nodeTo != null) {
                // already renamed, remove oldName
                delete nodeTo.oldName;
            }
            else if (nodeTo != null && nodeFrom != null && nodeTo !== nodeFrom) {
                // => original still exists and both are not the same (e.g. oldName = name)
                // find differences (e.g. new columns), keep new and old name
                const renameObj = helper.difference(nodeTo, nodeFrom);
                // always keep node name
                renameObj.name = nodeTo.name;
                // overwrite action and set to 'rename'
                renameObj[ACTION_KEY] = {
                    rename: true
                };
                // check if other changes were made besides a rename
                const otherChanges = helper.getPropertiesWithoutNested(renameObj, [ACTION_KEY, 'name', 'oldName', 'oldSchemaName']);
                if (Object.keys(otherChanges).length > 0) {
                    // yes, mark as changed as well
                    renameObj[ACTION_KEY].change = true;
                }
                renameObj.name = nodeTo.name;
                // oldName is not set for Schema migrations, use actual name instead
                renameObj.oldName = nodeTo.oldName || nodeTo.name;
                // remove old object that shall be renamed
                delete nextParentFrom[nodeFrom.name];
                // save merged as the new one
                nextParentTo[nodeTo.name] = renameObj;
                // check if node is a column and has constraints
                if (renameObj.constraintNames != null) {
                    // todo not implemented yet, for now column constraints will be recreated on rename -> does not harm, maybe improve later
                    // _renameColumnConstraints();
                }
                // check if node is a table and has constraints
                if (renameObj.constraints != null) {
                    _renameTableConstraints();
                }
                // check if node is a table and has relations
                if (pMigrationDbMeta.relations) {
                    _renameRelations();
                }
                /**
                 * Rename constraints (for tables)
                 */
                function _renameTableConstraints() {
                    const fromConstraints = nodeFrom.constraints;
                    const toConstraints = renameObj.constraints;
                    // both sides of constraints set?
                    if (fromConstraints != null && toConstraints != null) {
                        // iterate from constraints
                        const fromConstraintsNode = _splitActionFromNode(fromConstraints).node;
                        Object.entries(fromConstraintsNode).map((fromConstraintEntry) => {
                            const fromConstraintName = fromConstraintEntry[0];
                            // clean constraint definition
                            const fromConstraintDefinition = _splitActionFromNode(fromConstraintEntry[1]).node;
                            const fromConstraintDefinitionClean = helper.removeFromEveryNode(fromConstraintDefinition, ACTION_KEY);
                            // getSqlFromMigrationObj to constraint name
                            const toConstraintName = fromConstraintName.replace(renameObj.oldName, renameObj.name);
                            // clean constraint definition
                            const toConstraintDefinition = _splitActionFromNode(toConstraints[toConstraintName]).node;
                            const toConstraintDefinitionClean = helper.removeFromEveryNode(toConstraintDefinition, ACTION_KEY);
                            // rename if both constraints are similar
                            if (deepEqual(toConstraintDefinitionClean, fromConstraintDefinitionClean)) {
                                // getSqlFromMigrationObj rename constraint
                                toConstraints[toConstraintName] = {
                                    [ACTION_KEY]: {
                                        rename: true
                                    },
                                    oldName: fromConstraintName,
                                    // different constraint have to be renamed differently
                                    type: toConstraintDefinition.type
                                };
                                // delete old constraint
                                delete fromConstraints[fromConstraintName];
                            }
                        });
                    }
                }
                /**
                 * Rename relations (for tables)
                 */
                function _renameRelations() {
                    const newTableName = renameObj.name;
                    const newRelationSideName = `${newSchemaName}.${newTableName}`;
                    const oldTableName = renameObj.oldName || newTableName; // could be only change of schema name
                    const oldRelationSideName = `${oldSchemaName}.${oldTableName}`;
                    // iterate relations
                    const relationsToBeRenamed = Object.values(pMigrationDbMeta.relations).filter((relationsObj) => {
                        // iterate both sides of the relation
                        let result = false;
                        Object.values(relationsObj).map((sideOfRelation) => {
                            // find relations for this table
                            result = ((sideOfRelation.schemaName === newSchemaName || sideOfRelation.schemaName === oldSchemaName) &&
                                (sideOfRelation.tableName === newTableName || sideOfRelation.tableName === oldTableName));
                        });
                        return result;
                    });
                    // iterate found relations
                    Object.values(relationsToBeRenamed).map((relationObj) => {
                        // shallow clone (so that we can remove the name for comparison
                        const newRelation = Object.assign({}, relationObj[newRelationSideName]);
                        const oldRelation = Object.assign({}, relationObj[oldRelationSideName]);
                        // rename relation only, when both constraints are similar (without comparing table name)
                        delete newRelation.tableName;
                        delete oldRelation.tableName;
                        if (!deepEqual(oldRelation, newRelation)) {
                            // remove old part of relation
                            delete pMigrationDbMeta.relations[oldRelation.name][oldRelationSideName];
                            // mark remaining two as to be renamed
                            Object.values(relationObj).map((relationToTable) => {
                                if (relationToTable.tableName != null) {
                                    // mark
                                    relationToTable[ACTION_KEY] = {
                                        rename: true
                                    };
                                    // and return
                                    pMigrationDbMeta.relations[newRelation.name][newRelationSideName] = relationToTable;
                                }
                            });
                        }
                    });
                }
            }
        }
        return pMigrationDbMeta;
    }
})(migrationObject = exports.migrationObject || (exports.migrationObject = {}));
