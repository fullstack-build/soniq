import { IDbMeta } from '../IDbMeta';
import { registerDirectiveParser } from '../fromGQl/gQlAstToDbMeta';
import { registerTriggerParser } from '../fromPg/pgToDbMeta';
import {
  registerColumnMigrationExtension,
  registerTableMigrationExtension
} from '../toPg/createSqlObjFromMigrationObject';
import { IAction } from '../IMigrationSqlObj';
import * as helper from '../helper';

// GQl AST
// add directive parser
// createdAt
registerDirectiveParser('createdat', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  dbMetaNode.type = 'timestamp';
  dbMetaNode.defaultValue = {
    isExpression: true,
    value: 'now()'
  };
});

// updatedAt
registerDirectiveParser('updatedat', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  dbMetaNode.type = 'timestamp';
  dbMetaNode.defaultValue = {
    isExpression: true,
    value: 'now()',
  };
  dbMetaNode.extensions.triggerUpdatedAt = {
    isActive: true
  };
});

// PG
registerTriggerParser((trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => {
  // keep reference to current table
  const currentTable = dbMeta.schemas[schemaName].tables[tableName];

  if (trigger.trigger_name.includes('table_trigger_updatedat')) {
    // updatedAt trigger for column
    const triggerNameObj = trigger.trigger_name.split('_');
    const columnName = triggerNameObj[5];

    // only if column exists (trigger could be there without column)
    if (currentTable.columns[columnName] != null) {
      currentTable.columns[columnName].extensions.triggerUpdatedAt = {
        isActive: true
      };
    }
  }
});

// Migration SQL
registerColumnMigrationExtension('triggerUpdatedAt', (extensionDefinitionWithAction,
                                                      thisSql,
                                                      schemaName,
                                                      tableName,
                                                      columnName) => {

  const ACTION_KEY: string = '$$action$$';
  function _splitActionFromNode(node: {} = {}): {action: IAction, node: any} {
    return helper.splitActionFromNode(ACTION_KEY, node);
  }

  const tableNameWithSchema           = `"${schemaName}"."${tableName}"`;
  const triggerUpdatedAtActionObject  = _splitActionFromNode(extensionDefinitionWithAction);
  const triggerUpdatedAtAction        = triggerUpdatedAtActionObject.action;
  const triggerUpdatedAtDef           = triggerUpdatedAtActionObject.node;
  const triggerName                   = `table_trigger_updatedat_${schemaName}_${tableName}_${columnName}`;

  // drop trigger for remove and before add (in case it's already there)
  if (triggerUpdatedAtAction.remove || triggerUpdatedAtAction.add || triggerUpdatedAtAction.change) {
    thisSql.up.push(`DROP TRIGGER IF EXISTS "${triggerName}" ON ${tableNameWithSchema} CASCADE;`);
  }
  // create trigger when active
  if ((triggerUpdatedAtAction.add || triggerUpdatedAtAction.change) && triggerUpdatedAtDef.isActive === true) {
    thisSql.up.push(`CREATE TRIGGER "${triggerName}"
          BEFORE UPDATE
          ON ${tableNameWithSchema}
          FOR EACH ROW
          EXECUTE PROCEDURE _meta.triggerUpdateOrCreate("${columnName}");`);
  }
});
