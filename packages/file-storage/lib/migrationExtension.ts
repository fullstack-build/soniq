import { IDbMeta,
  registerDirectiveParser,
  registerQueryParser,
  registerTriggerParser,
  registerColumnMigrationExtension,
  registerTableMigrationExtension,
  splitActionFromNode,
  utils } from '@fullstack-one/schema-builder';

const ACTION_KEY: string = '$$action$$';
function _splitActionFromNode(node: {} = {}): {action: any, node: any} {
  return splitActionFromNode(ACTION_KEY, node);
}

// GQl AST
// add directive parser
registerDirectiveParser('files', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  refDbMetaCurrentTable.extensions.fileTrigger = {
    isActive: true
  };
  const directiveArguments: any = utils.parseDirectiveArguments(gQlDirectiveNode);
  refDbMetaCurrentTableColumn.isFileColumn = {
    isActive: true,
    types: JSON.stringify(directiveArguments.types || ['DEFAULT'])
  };
});

// PG
// query parser
registerQueryParser(async (dbClient, dbMeta) => {
  try {
    const { rows } = await dbClient.pgClient.query(
      'SELECT * FROM _meta."FileFields";'
    );

    rows.forEach((row) => {
      const thisColumn = dbMeta.schemas[row.schemaName].tables[row.tableName].columns[row.columnName];
      thisColumn.extensions.isFileColumn = {
        isActive: true,
        types: JSON.stringify(row.types)
      };
    });
  } catch (err) {
    // ignore error in case settings -> not set up yet
  }
});
// trigger parser
registerTriggerParser((trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => {
  // keep reference to current table
  const currentTable = dbMeta.schemas[schemaName].tables[tableName];

  if (trigger.trigger_name.includes('table_file_trigger')) {
    currentTable.extensions.fileTrigger = {
      isActive: true
    };
  }
});

// Migration SQL
// table
registerTableMigrationExtension('fileTrigger', (extensionDefinitionWithAction,
                                                sqlMigrationObj,
                                                nodeSqlObj,
                                                schemaName,
                                                tableNameDown,
                                                tableNameUp) => {

  const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;

  // create
  const fileTriggerActionObject  = _splitActionFromNode(extensionDefinitionWithAction);
  const fileTriggerAction        = fileTriggerActionObject.action;
  const fileTriggerDef           = fileTriggerActionObject.node;

  // drop trigger for remove and before add (in case it's already there)
  if (fileTriggerAction.remove || fileTriggerAction.add || fileTriggerAction.change) {
    // drop trigger, keep table and data
    nodeSqlObj.up.push(`DROP TRIGGER IF EXISTS "table_file_trigger_${schemaName}_${tableNameUp}" ON ${tableNameWithSchemaUp} CASCADE;`);
  }

  // create file-trigger
  if (fileTriggerAction.add || fileTriggerAction.change) {

    // create file-trigger for table
    if (fileTriggerDef.isActive === true) { // has to be set EXACTLY to true
      nodeSqlObj.up.push(`CREATE TRIGGER "table_file_trigger_${schemaName}_${tableNameUp}"
        BEFORE UPDATE OR INSERT OR DELETE
        ON ${tableNameWithSchemaUp}
        FOR EACH ROW
        EXECUTE PROCEDURE _meta.file_trigger();`);
    }
  }
});

// column
registerColumnMigrationExtension('isFileColumn', (extensionDefinitionWithAction,
                                                  nodeSqlObj,
                                                  schemaName,
                                                  tableName,
                                                  columnName) => {
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
      thisSqlObj.down.push(
        `DELETE FROM "_meta"."FileColumns" WHERE "schemaName" = '${schemaName}' ` +
        `AND "tableName" = '${tableName}' AND "columnName" = '${columnName}'`);
    } else {
      thisSqlObj.up.push(
        'INSERT INTO "_meta"."FileColumns"("schemaName", "tableName", "columnName", "types") ' +
        `VALUES('${schemaName}', '${tableName}', '${columnName}', '${fileNodeDefinition.types}') ` +
        `ON CONFLICT ("schemaName", "tableName", "columnName") DO UPDATE SET "types"='${fileNodeDefinition.types}';`);
    }
  }

});
