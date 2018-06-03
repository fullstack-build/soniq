import { IDbMeta } from '../IDbMeta';
import { registerDirectiveParser } from '../fromGQl/gQlAstToDbMeta';
import { registerTriggerParser } from '../fromPg/pgToDbMeta';
import { registerTableMigrationExtension } from '../toPg/createSqlObjFromMigrationObject';
import { IAction } from '../IMigrationSqlObj';
import * as helper from '../helper';

// GQl AST:
// add directive parser
// nonUpdatable
registerDirectiveParser('nonupdatable', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  dbMetaNode.extensions.immutable = {
    isUpdatable: false
  };
});
// immutable
registerDirectiveParser('immutable', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  dbMetaNode.extensions.immutable = {
    isUpdatable: false,
    isDeletable: false
  };
});

// PG
registerTriggerParser((trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => {
  // keep reference to current table
  const currentTable = dbMeta.schemas[schemaName].tables[tableName];

  if (trigger.trigger_name.includes('table_is_not_updatable')) {
    // immutability active for table: non updatable
    currentTable.extensions.immutable = currentTable.extensions.immutable || {}; // keep potentially existing object
    currentTable.extensions.immutable.isUpdatable = false;
  } else if (trigger.trigger_name.includes('table_is_not_deletable')) {
    // immutability active for table: non deletable
    currentTable.extensions.immutable = currentTable.extensions.immutable || {}; // keep potentially existing object
    currentTable.extensions.immutable.isDeletable = false;
  }
});

// Migration SQL
registerTableMigrationExtension('immutable', (extensionDefinitionWithAction,
                                              nodeSqlObj,
                                              schemaName,
                                              tableNameDown,
                                              tableNameUp) => {

  const ACTION_KEY: string = '$$action$$';
  function _splitActionFromNode(node: {} = {}): {action: IAction, node: any} {
    return helper.splitActionFromNode(ACTION_KEY, node);
  }

  const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;

  // create
  const immutabilityActionObject  = _splitActionFromNode(extensionDefinitionWithAction);
  const immutabilityAction        = immutabilityActionObject.action;
  const immutabilityDef           = immutabilityActionObject.node;

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
