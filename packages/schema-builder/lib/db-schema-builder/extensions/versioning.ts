import { IDbMeta,
  registerDirectiveParser,
  registerTriggerParser,
  registerColumnMigrationExtension,
  registerTableMigrationExtension,
  splitActionFromNode,
  utils } from '../../index';

// GQl AST
// add directive parser
registerDirectiveParser('versioning', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  dbMetaNode.extensions.versioning = {
    isActive: true
  };
});

// PG
registerTriggerParser((trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => {
  // keep reference to current table
  const currentTable = dbMeta.schemas[schemaName].tables[tableName];

  if (trigger.trigger_name.includes('table_trigger_create_versions')) {
    // versioning active for table
    currentTable.extensions.versioning = {
      isActive: true
    };
  }
});

// Migration SQL
registerTableMigrationExtension('versioning', (extensionDefinitionWithAction,
                                               sqlMigrationObj,
                                               nodeSqlObj,
                                               schemaName,
                                               tableNameDown,
                                               tableNameUp) => {

  const ACTION_KEY: string = '$$action$$';
  function _splitActionFromNode(node: {} = {}): { action: any, node: any } {
    return splitActionFromNode(ACTION_KEY, node);
  }

  const tableNameWithSchemaUp   = `"${schemaName}"."${tableNameUp}"`;
  const versionTableNameWithSchemaUp   = `_versions."${schemaName}_${tableNameUp}"`;

  // create
  const versioningActionObject = _splitActionFromNode(extensionDefinitionWithAction);
  const versioningAction = versioningActionObject.action;
  const versioningDef = versioningActionObject.node;

  // drop trigger for remove and before add (in case it's already there)
  if (versioningAction.remove || versioningAction.add) {
    // drop trigger, keep table and data
    nodeSqlObj.up.push(`DROP TRIGGER IF EXISTS "table_trigger_create_versions" ON ${tableNameWithSchemaUp} CASCADE;`);
  }

  // create versioning table and trigger
  if (versioningAction.add) {

    // (re-)create versioning table if not exists
    nodeSqlObj.up.push(`CREATE SCHEMA IF NOT EXISTS "_versions";`);
    nodeSqlObj.up.push(`CREATE TABLE IF NOT EXISTS ${versionTableNameWithSchemaUp}
          (
            id uuid NOT NULL DEFAULT uuid_generate_v4(),
            created_at timestamp without time zone DEFAULT now(),
            user_id uuid,
            created_by character varying(255),
            action _meta.versioning_action,
            table_name character varying(255),
            table_id uuid,
            state jsonb,
            diff jsonb,
            CONSTRAINT _version_${schemaName}_${tableNameUp}_pkey PRIMARY KEY (id)
        );`);

    // create trigger for table
    nodeSqlObj.up.push(`CREATE TRIGGER "table_trigger_create_versions"
          AFTER INSERT OR UPDATE OR DELETE
          ON ${tableNameWithSchemaUp}
          FOR EACH ROW
          EXECUTE PROCEDURE _meta.create_version();`);
  }
});
