import * as _ from 'lodash';
import { setDefaultValueForColumn, addMigration, createConstraint } from '../gQlAstToDbMetaHelper';
import * as utils from '../../../gql-schema-builder/utils';
import { registerDirectiveParser } from './index';

const { parseDirectiveArguments } = utils;

// ignore table, just make it available
registerDirectiveParser('table', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // nothing to do here -> has been done in ObjectTypeDefinition
});

// mark as computed
registerDirectiveParser('computed', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'computed';
});

// mark as customResolver
registerDirectiveParser('custom', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'customResolver';
});
// add unique constraint
registerDirectiveParser('unique', (gQlDirectiveASTNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {

  let constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_key`;
  // named unique constraint - override
  if (gQlDirectiveASTNode.arguments[0] != null && gQlDirectiveASTNode.arguments[0].name.value === 'name') {
    const namedConstraintName = gQlDirectiveASTNode.arguments[0].value.value;
    constraintName = `${refDbMetaCurrentTable.name}_${namedConstraintName}_key`;
  }

  createConstraint(constraintName, 'UNIQUE', {}, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);

});
// native PG check constraint
registerDirectiveParser('check', (gQlDirectiveASTNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // iterate over all constraints
    gQlDirectiveASTNode.arguments.forEach((argument) => {

      const checkName = argument.name.value;
      const constraintName = `${refDbMetaCurrentTable.name}_${checkName}_check`;
      const options = {
        param1: argument.value.value
      };

      // create constraint
      createConstraint(constraintName, 'CHECK', options, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);

    });
});

// embedded json types -> jsonb
registerDirectiveParser('json', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    dbMetaNode.type = 'jsonb';
});
// override type with PG native type
registerDirectiveParser('type', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const customType = _.get(gQlDirectiveNode, 'arguments[0].value.value');

    if (customType.toLowerCase() === 'json') {
      dbMetaNode.type = 'json';
    } else if (customType.toLowerCase() === 'jsonb') {
      dbMetaNode.type = 'jsonb';
    } else {
      // assume everything unknown by GraphQL is a custom type
      dbMetaNode.type = 'customType';
      dbMetaNode.customType = customType;
    }
});
// set default value
registerDirectiveParser('default', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    setDefaultValueForColumn(gQlDirectiveNode,
                            dbMetaNode,
                            refDbMeta,
                            refDbMetaCurrentTable,
                            refDbMetaCurrentTableColumn);
});

// add special migration
registerDirectiveParser('migrate', (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    addMigration(gQlDirectiveNode, dbMetaNode, refDbMeta);
});
