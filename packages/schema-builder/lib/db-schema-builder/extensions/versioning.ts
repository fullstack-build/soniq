import { IDbMeta } from '../IDbMeta';
import { registerDirectiveParser } from '../graphql/gQlAstToDbMeta';
import { registerTriggerParser } from '../pg/pgToDbMeta';

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

  if (trigger.trigger_name.includes('create_version')) {
    // versioning active for table
    currentTable.extensions.versioning = {
      isActive: true
    };
  }

});
