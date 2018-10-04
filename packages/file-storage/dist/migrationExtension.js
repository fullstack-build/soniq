"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const schema_builder_1 = require("@fullstack-one/schema-builder");
const ACTION_KEY = "$$action$$";
function _splitActionFromNode(node = {}) {
    return schema_builder_1.splitActionFromNode(ACTION_KEY, node);
}
// GQl AST
// add directive parser
schema_builder_1.registerDirectiveParser("files", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    refDbMetaCurrentTable.extensions.fileTrigger = {
        isActive: true
    };
    const directiveArguments = schema_builder_1.utils.parseDirectiveArguments(gQlDirectiveNode);
    refDbMetaCurrentTableColumn.isFileColumn = {
        isActive: true,
        types: JSON.stringify(directiveArguments.types || ["DEFAULT"])
    };
});
// PG
// query parser
schema_builder_1.registerQueryParser((dbClient, dbMeta) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { rows } = yield dbClient.pgClient.query('SELECT * FROM _meta."FileFields";');
        rows.forEach((row) => {
            const thisColumn = dbMeta.schemas[row.schemaName].tables[row.tableName].columns[row.columnName];
            thisColumn.extensions.isFileColumn = {
                isActive: true,
                types: JSON.stringify(row.types)
            };
        });
    }
    catch (err) {
        // ignore error in case settings -> not set up yet
    }
}));
// trigger parser
schema_builder_1.registerTriggerParser((trigger, dbMeta, schemaName, tableName) => {
    // keep reference to current table
    const currentTable = dbMeta.schemas[schemaName].tables[tableName];
    if (trigger.trigger_name.includes("table_file_trigger")) {
        currentTable.extensions.fileTrigger = {
            isActive: true
        };
    }
});
// Migration SQL
// table
schema_builder_1.registerTableMigrationExtension("fileTrigger", (extensionDefinitionWithAction, sqlMigrationObj, nodeSqlObj, schemaName, tableNameDown, tableNameUp) => {
    const tableNameWithSchemaUp = `"${schemaName}"."${tableNameUp}"`;
    // create
    const fileTriggerActionObject = _splitActionFromNode(extensionDefinitionWithAction);
    const fileTriggerAction = fileTriggerActionObject.action;
    const fileTriggerDef = fileTriggerActionObject.node;
    // drop trigger for remove and before add (in case it's already there)
    if (fileTriggerAction.remove || fileTriggerAction.add || fileTriggerAction.change) {
        // drop trigger, keep table and data
        nodeSqlObj.up.push(`DROP TRIGGER IF EXISTS "table_file_trigger_${schemaName}_${tableNameUp}" ON ${tableNameWithSchemaUp} CASCADE;`);
    }
    // create file-trigger
    if (fileTriggerAction.add || fileTriggerAction.change) {
        // create file-trigger for table
        if (fileTriggerDef.isActive === true) {
            // has to be set EXACTLY to true
            nodeSqlObj.up.push(`CREATE TRIGGER "table_file_trigger_${schemaName}_${tableNameUp}"
        BEFORE UPDATE OR INSERT OR DELETE
        ON ${tableNameWithSchemaUp}
        FOR EACH ROW
        EXECUTE PROCEDURE _meta.file_trigger();`);
        }
    }
});
// column
schema_builder_1.registerColumnMigrationExtension("isFileColumn", (extensionDefinitionWithAction, nodeSqlObj, schemaName, tableName, columnName) => {
    // create, set ref and keek ref for later
    const thisSqlObj = (nodeSqlObj.crud = nodeSqlObj.crud || {
        sql: {
            up: [],
            down: []
        }
    }).sql;
    const fileNodeObj = _splitActionFromNode(extensionDefinitionWithAction);
    const fileNodeAction = fileNodeObj.action;
    const fileNodeDefinition = fileNodeObj.node;
    // create entry
    if (fileNodeDefinition.isActive === true) {
        if (fileNodeAction.remove) {
            thisSqlObj.down.push(`DELETE FROM "_meta"."FileColumns" WHERE "schemaName" = '${schemaName}' ` +
                `AND "tableName" = '${tableName}' AND "columnName" = '${columnName}'`);
        }
        else {
            thisSqlObj.up.push('INSERT INTO "_meta"."FileColumns"("schemaName", "tableName", "columnName", "types") ' +
                `VALUES('${schemaName}', '${tableName}', '${columnName}', '${fileNodeDefinition.types}') ` +
                `ON CONFLICT ("schemaName", "tableName", "columnName") DO UPDATE SET "types"='${fileNodeDefinition.types}';`);
        }
    }
});
