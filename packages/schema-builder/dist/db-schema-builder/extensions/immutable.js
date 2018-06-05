"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
// GQl AST:
// add directive parser
// nonUpdatable
index_1.registerDirectiveParser('nonupdatable', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.extensions.immutable = {
        isUpdatable: false
    };
});
// immutable
index_1.registerDirectiveParser('immutable', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.extensions.immutable = {
        isUpdatable: false,
        isDeletable: false
    };
});
// PG
index_1.registerTriggerParser((trigger, dbMeta, schemaName, tableName) => {
    // keep reference to current table
    const currentTable = dbMeta.schemas[schemaName].tables[tableName];
    if (trigger.trigger_name.includes('table_is_not_updatable')) {
        // immutability active for table: non updatable
        currentTable.extensions.immutable = currentTable.extensions.immutable || {}; // keep potentially existing object
        currentTable.extensions.immutable.isUpdatable = false;
    }
    else if (trigger.trigger_name.includes('table_is_not_deletable')) {
        // immutability active for table: non deletable
        currentTable.extensions.immutable = currentTable.extensions.immutable || {}; // keep potentially existing object
        currentTable.extensions.immutable.isDeletable = false;
    }
});
// Migration SQL
index_1.registerTableMigrationExtension('immutable', (extensionDefinitionWithAction, sqlMigrationObj, nodeSqlObj, schemaName, tableNameDown, tableNameUp) => {
    const ACTION_KEY = '$$action$$';
    function _splitActionFromNode(node = {}) {
        return index_1.splitActionFromNode(ACTION_KEY, node);
    }
    const tableNameWithSchemaUp = `"${schemaName}"."${tableNameUp}"`;
    // create
    const immutabilityActionObject = _splitActionFromNode(extensionDefinitionWithAction);
    const immutabilityAction = immutabilityActionObject.action;
    const immutabilityDef = immutabilityActionObject.node;
    // drop trigger for remove and before add (in case it's already there)
    if (immutabilityAction.remove || immutabilityAction.add || immutabilityAction.change) {
        // drop trigger, keep table and data
        nodeSqlObj.up.push(`DROP TRIGGER IF EXISTS "table_is_not_updatable_${schemaName}_${tableNameUp}" ON ${tableNameWithSchemaUp} CASCADE;`);
        nodeSqlObj.up.push(`DROP TRIGGER IF EXISTS "table_is_not_deletable_${schemaName}_${tableNameUp}" ON ${tableNameWithSchemaUp} CASCADE;`);
    }
    // create immutability table and trigger
    if (immutabilityAction.add || immutabilityAction.change) {
        // create trigger for table: not updatable
        if (immutabilityDef.isUpdatable === false) { // has to be set EXACTLY to false
            nodeSqlObj.up.push(`CREATE TRIGGER "table_is_not_updatable_${schemaName}_${tableNameUp}"
        BEFORE UPDATE
        ON ${tableNameWithSchemaUp}
        FOR EACH ROW
        EXECUTE PROCEDURE _meta.make_table_immutable();`);
        }
        // create trigger for table: not updatable
        if (immutabilityDef.isDeletable === false) { // has to be set EXACTLY to false
            nodeSqlObj.up.push(`CREATE TRIGGER "table_is_not_deletable_${schemaName}_${tableNameUp}"
        BEFORE DELETE
        ON ${tableNameWithSchemaUp}
        FOR EACH ROW
        EXECUTE PROCEDURE _meta.make_table_immutable();`);
        }
    }
});
