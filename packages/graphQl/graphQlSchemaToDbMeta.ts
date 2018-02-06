import * as _ from 'lodash';

import { IDbMeta, IDbRelation } from '../core/IDbMeta';

export const parseGraphQlJsonSchemaToDbMeta = (graphQlJsonSchema): IDbMeta => {
  const dbMeta: IDbMeta = {
    version: 1.0,
    schemas: {},
    enums: {},
    relations: {},
    exposedNames: {}
  };
  parseGraphQlJsonNode(graphQlJsonSchema, dbMeta);
  // return copy instead of ref
  return _.cloneDeep(dbMeta);
};

// refDbMetaCurrentTable:
//  - ref to current parent table obj will be passed through all iterations after table was added
// refDbMetaCurrentTableColumn:
// - ref to current parent table column obj will be passed through all iterations
//   after table column was added
function parseGraphQlJsonNode(
  gQlSchemaNode,
  dbMetaNode,
  dbMeta?,
  refDbMetaCurrentTable?,
  refDbMetaCurrentTableColumn?,
) {
  // ref to dbMeta will be passed through all iterations
  const refDbMeta = dbMeta || dbMetaNode;

  // dynamic parser loader
  if (gQlSchemaNode == null || gQlSchemaNode.kind == null) {
    // ignore empty nodes or nodes without a kind
  } else if (GQL_JSON_PARSER[gQlSchemaNode.kind] == null) {
    process.stderr.write(
      'GraphQL.parser.error.unknown.type: ' + gQlSchemaNode.kind + '\n',
    );
  } else {
    // parse
    GQL_JSON_PARSER[gQlSchemaNode.kind](
      gQlSchemaNode,
      dbMetaNode,
      refDbMeta,
      refDbMetaCurrentTable,
      refDbMetaCurrentTableColumn,
    );
  }
}

const GQL_JSON_PARSER = {
  // iterate over all type definitions
  Document: (gQlSchemaNode, dbMetaNode, refDbMeta) => {

    // FIRST round:
    // getSqlFromMigrationObj blank objects for all tables and enums (needed for validation of relationships)
    // but don't continue recursively
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      // type
      if (gQlJsonSchemaDocumentNode.kind === 'ObjectTypeDefinition') {
        GQL_JSON_PARSER.ObjectTypeDefinition(gQlJsonSchemaDocumentNode, dbMetaNode, refDbMeta, false);

      } else if (gQlJsonSchemaDocumentNode.kind === 'EnumTypeDefinition') {
        // convention: enums are global
        GQL_JSON_PARSER.EnumTypeDefinition(gQlJsonSchemaDocumentNode, dbMetaNode, refDbMeta);
      }
    });

    // SECOND round:
    // parse all documents recursively
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      parseGraphQlJsonNode(gQlJsonSchemaDocumentNode, dbMetaNode, refDbMeta);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (gQlSchemaDocumentNode, dbMetaNode, refDbMeta, continueRecursively: boolean = true) => {

    const typeName = gQlSchemaDocumentNode.name.value;

    // find table directive
    const dbDirective = gQlSchemaDocumentNode.directives.find((directive) => {
      return (directive.kind === 'Directive' && directive.name.value === 'table');
    });

    // ignore if not a table definition
    if (dbDirective == null) {
      return;
    }

    const schemaAndTableName = dbDirective.arguments.reduce((result, argument) => {
      result.schemaName = (argument.name.value === 'schemaName') ? argument.value.value : result.schemaName;
      result.tableName = (argument.name.value === 'tableName') ? argument.value.value : result.tableName;
      return result;
    },                                                      { schemaName: null, tableName: null });

    const schemaName  = schemaAndTableName.schemaName || 'public';
    const tableName   = schemaAndTableName.tableName || typeName;

    // find or getSqlFromMigrationObj schema
    refDbMeta.schemas[schemaName] = refDbMeta.schemas[schemaName] || {
      name: schemaName,
      tables:{},
      views: []
    };

    // find or getSqlFromMigrationObj table in schema
    // and save ref to tableObject for recursion
    const refDbMetaCurrentTable = refDbMeta.schemas[schemaName].tables[tableName] = refDbMeta.schemas[schemaName].tables[tableName] || {
      schemaName,
      name: tableName,
      description: null,
      constraints: {}
    };

    // add exposed name to list with reference to underlying table
    refDbMeta.exposedNames[typeName] = {
      schemaName: refDbMetaCurrentTable.schemaName,
      tableName: refDbMetaCurrentTable.name
    };

    // stop here in first round
    if (!continueRecursively) {
      return;
    }

    // parse ObjectType properties
    Object.values(gQlSchemaDocumentNode).map((gQlSchemaDocumentNodeProperty) => {
      // iterate over sub nodes (e.g. intefaces, fields, directives
      if (Array.isArray(gQlSchemaDocumentNodeProperty)) {
        Object.values(gQlSchemaDocumentNodeProperty).map((gQlSchemaDocumentSubnode) => {
            // parse sub node
            parseGraphQlJsonNode(
              gQlSchemaDocumentSubnode,
              refDbMetaCurrentTable,
              refDbMeta,
              refDbMetaCurrentTable,
            );
          },
        );
      }
    });
  },

  // parse EnumType
  EnumTypeDefinition: (gQlEnumTypeDefinitionNode,
                       dbMetaNode,
                       refDbMeta) => {
    const enumName = gQlEnumTypeDefinitionNode.name.value;
    const enumValues = gQlEnumTypeDefinitionNode.values.reduce((values, gQlEnumTypeDefinitionNodeValue) => {
      values.push(gQlEnumTypeDefinitionNodeValue.name.value);
      return values;
    }, []);

    // convention enums are DB wide (keep values from previous round if already set)
    dbMetaNode.enums[enumName] = dbMetaNode.enums[enumName] || {
      name: enumName,
      values: enumValues,
      columns: {}
    };
  },

  // parse Directive
  Directive: (gQlDirectiveNode,
              dbMetaNode,
              refDbMeta,
              refDbMetaCurrentTable,
              refDbMetaCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    switch ((directiveKind).toLowerCase()) {
      case 'table':
        // nothing to do here -> has been done in ObjectTypeDefinition
        break;
      case 'unique':

        addConstraint('UNIQUE',
                      gQlDirectiveNode,
                      dbMetaNode,
                      refDbMeta,
                      refDbMetaCurrentTable,
                      refDbMetaCurrentTableColumn);
        break;
      case 'check': // native PG check constraint
        // iterate over all constraints
        gQlDirectiveNode.arguments.forEach((argument) => {
          addConstraint('CHECK',
                        argument,
                        dbMetaNode,
                        refDbMeta,
                        refDbMetaCurrentTable,
                        refDbMetaCurrentTableColumn);
        });
        break;
      case 'validate': // validate constraint

        // iterate over all constraints
        gQlDirectiveNode.arguments.forEach((argument) => {
          addConstraint('validate',
                        argument,
                        dbMetaNode,
                        refDbMeta,
                        refDbMetaCurrentTable,
                        refDbMetaCurrentTableColumn);
        });
        break;
      case 'computed': // mark as computed
        dbMetaNode.type = 'computed';
        break;
      case 'custom': // mark as customResolver
        dbMetaNode.type = 'customResolver';
        break;
      case 'json': // embedded json types -> jsonb
          dbMetaNode.type = 'jsonb';
          break;
      case 'type': // override type with PG native type
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
        break;
      case 'migrate':
        // add special miration
        addMigration(gQlDirectiveNode, dbMetaNode, refDbMeta);
        break;
      case 'versioning':
        dbMetaNode.versioning = {
          isActive: true
        };
        break;
      case 'nonupdatable':
        dbMetaNode.immutable = {
          isUpdatable: false
        };
        break;
      case 'immutable':
        dbMetaNode.immutable = {
          isUpdatable: false,
          isDeletable: false
        };
        break;
      case 'default': // set default value
        setDefaultValueForColumn(gQlDirectiveNode,
                                 dbMetaNode,
                                 refDbMeta,
                                 refDbMetaCurrentTable,
                                 refDbMetaCurrentTableColumn);
        break;
      default:
        let pathToDirective = '';
        if (refDbMetaCurrentTable != null && refDbMetaCurrentTable.name) {
         pathToDirective = refDbMetaCurrentTable.name;
        }
        if (refDbMetaCurrentTableColumn != null && refDbMetaCurrentTableColumn.name) {
          pathToDirective += '.' + refDbMetaCurrentTableColumn.name;
        }

        process.stderr.write(
          'GraphQL.parser.error.unknown.directive.kind: ' +
              pathToDirective + '.' + directiveKind + '\n',
        );
        break;
    }
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (
    gQlFieldDefinitionNode,
    dbMetaNode,
    refDbMeta,
    refDbMetaCurrentTable,
  ) => {
    // getSqlFromMigrationObj columns object if not set already
    dbMetaNode.columns = dbMetaNode.columns || {};

    // check if column is relation
    if (_.get(gQlFieldDefinitionNode, 'directives[0].name.value') === 'relation') {
      // handle relation
     relationBuilderHelper(
        gQlFieldDefinitionNode,
        dbMetaNode,
        refDbMeta,
        refDbMetaCurrentTable
      );
    } else {
      // handle normal column

      const newField = {
        name: null,
        type: null,
        description: null
      };

      // parse FieldDefinition properties
      Object.values(gQlFieldDefinitionNode).map((gQlSchemaFieldNodeProperty) => {
        if (
          typeof gQlSchemaFieldNodeProperty === 'object' &&
          !Array.isArray(gQlSchemaFieldNodeProperty)
        ) { // object

          // parse sub node
          parseGraphQlJsonNode(
            gQlSchemaFieldNodeProperty,
            newField,
            refDbMeta,
            refDbMetaCurrentTable,
            newField,
          );
        } else if (
          typeof gQlSchemaFieldNodeProperty === 'object' &&
          !!Array.isArray(gQlSchemaFieldNodeProperty)
        ) { // array

          // iterate over sub nodes (e.g. arguments, directives
          Object.values(gQlSchemaFieldNodeProperty).map((gQlSchemaFieldSubnode) => {
              // parse sub node
              parseGraphQlJsonNode(
                gQlSchemaFieldSubnode,
                newField,
                refDbMeta,
                refDbMetaCurrentTable,
                newField,
              );
            },
          );
        }
      });

      // add new column ref to dbMeta
      // newField will now update data in the dbMeta through this ref
      dbMetaNode.columns[newField.name] = newField;
    }

  },

  // parse Name kind
  Name: (
    gQlSchemaNode,
    dbMetaNode,
    refDbMeta,
    refDbMetaCurrentTable,
    refDbMetaCurrentTableColumn,
  ) => {
    if (gQlSchemaNode != null && dbMetaNode != null) {
      // set column name
      dbMetaNode.name = gQlSchemaNode.value;
    }
  },

  // parse NamedType kind
  NamedType: (
    gQlSchemaNode,
    dbMetaNode,
    refDbMeta,
    refDbMetaCurrentTable,
    refDbMetaCurrentTableColumn,
  ) => {
    const columnTypeLowerCase = gQlSchemaNode.name.value.toLocaleLowerCase();
    dbMetaNode.type = 'varchar';
    // types
    // GraphQl: http://graphql.org/graphql-js/basic-types/
    // PG: https://www.postgresql.org/docs/current/static/datatype.html
    switch (columnTypeLowerCase) {
      case 'id':
        // set type to uuid
        dbMetaNode.type = 'uuid';
        dbMetaNode.defaultValue = {
          isExpression: true,
          value: 'uuid_generate_v4()'
        };
        // add new PK constraint
        addConstraint('PRIMARY KEY',
                      gQlSchemaNode,
                      dbMetaNode,
                      refDbMeta,
                      refDbMetaCurrentTable,
                      refDbMetaCurrentTableColumn);
        break;
      case 'string':
        dbMetaNode.type = 'varchar';
        break;
      case 'int':
        dbMetaNode.type = 'int4';
        break;
      case 'float':
        dbMetaNode.type = 'float8';
        break;
      case 'boolean':
        dbMetaNode.type = 'bool';
        break;
      case 'json':
        dbMetaNode.type = 'jsonb';
        break;
      default:
        // check dynamic types
        // enum?
        const foundEnum = Object.values(refDbMeta.enums).find((enumObj) => {
          return (enumObj.name.toLowerCase() === columnTypeLowerCase);
        });
        if (foundEnum != null) {
          // enum
          dbMetaNode.type = 'enum';
          dbMetaNode.customType = foundEnum.name;

          // add column name to enum columns list
          if (refDbMetaCurrentTable.schemaName != null && refDbMetaCurrentTable.tableName != null && refDbMetaCurrentTable.columnName != null) {
            const enumColumnName = `${refDbMetaCurrentTable.schemaName}.${refDbMetaCurrentTable.name}.${refDbMetaCurrentTableColumn.name}`;

            foundEnum.columns[enumColumnName] = {
              schemaName: refDbMetaCurrentTable.schemaName,
              tableName:  refDbMetaCurrentTable.name,
              columnName: refDbMetaCurrentTableColumn.name
            };
          }
        } else {
          // unknown type, probably a nested document (jsonb)
        }
        break;
    }

  },

  // parse NonNullType kind
  NonNullType: (
    gQlSchemaNode,
    dbMetaNode,
    refDbMeta,
    refDbMetaCurrentTable,
    refDbMetaCurrentTableColumn,
  ) => {
    // add new constraint
    addConstraint('not_null',
                  gQlSchemaNode,
                  dbMetaNode,
                  refDbMeta,
                  refDbMetaCurrentTable,
                  refDbMetaCurrentTableColumn);

    // parse sub type
    if (gQlSchemaNode.type != null) {
      const gQlSchemaTypeNode = gQlSchemaNode.type;
      parseGraphQlJsonNode(
        gQlSchemaTypeNode,
        dbMetaNode,
        refDbMeta,
        refDbMetaCurrentTable,
        refDbMetaCurrentTableColumn,
      );
    }
  },

  // set list type
  ListType: (
    gQlSchemaTypeNode,
    dbMetaNode,
    refDbMeta,
    refDbMetaCurrentTable,
    refDbMetaCurrentTableColumn,
  ) => {
    dbMetaNode.type = 'jsonb';
    dbMetaNode.defaultValue = {};
  },

  // parse Argument
  Argument: (
    gQlNode,
    dbMetaNode,
    refDbMeta,
    refDbMetaCurrentTable,
    refDbMetaCurrentTableColumn,
  ) => {
    // set argument name and value
    if (gQlNode != null && dbMetaNode != null) {
      dbMetaNode[gQlNode.name.value] = gQlNode.value.value;
    }
  }
};

function setDefaultValueForColumn(gQlSchemaNode,
                                  dbMetaNode,
                                  refDbMeta,
                                  refDbMetaCurrentTable,
                                  refDbMetaCurrentTableColumn) {

  const isExpression = (_.get(gQlSchemaNode, 'arguments[0].name.value').toLocaleLowerCase() === 'expression');
  const defaultValue = _.get(gQlSchemaNode, 'arguments[0].value.value');
  // add default object to column
  refDbMetaCurrentTableColumn.defaultValue = {
    isExpression,
    value: defaultValue
  };

}

function addConstraint(pConstraintType,
                       gQlSchemaNode,
                       dbMetaNode,
                       refDbMeta,
                       refDbMetaCurrentTable,
                       refDbMetaCurrentTableColumn) {

  let constraintType = pConstraintType;
  let constraintName  = null;
  let options         = {};
  let linkToColumn    = null;
  switch (constraintType) {
    case 'not_null':
      constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_not_null`;
      // link this constraint to a column
      linkToColumn  = refDbMetaCurrentTableColumn.name;
      break;
    case 'UNIQUE':
      constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_key`;
      // named unique constraint - override
      if (gQlSchemaNode.arguments[0] != null && gQlSchemaNode.arguments[0].name.value === 'name') {
        const namedConstraintName = gQlSchemaNode.arguments[0].value.value;
        constraintName = `${refDbMetaCurrentTable.name}_${namedConstraintName}_key`;
      }
      // link this constraint to a column
      linkToColumn  = refDbMetaCurrentTableColumn.name;
      break;
    case 'PRIMARY KEY':
      constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_pkey`;
      // link this constraint to a column
      linkToColumn  = refDbMetaCurrentTableColumn.name;
      break;
    case 'CHECK':
      const checkName = gQlSchemaNode.name.value;
      options = {
        param1: gQlSchemaNode.value.value
      };
      constraintName = `${refDbMetaCurrentTable.name}_${checkName}_check`;
      break;
    case 'validate':
      constraintType = 'CHECK'; // validate turns into check
      const validateType = gQlSchemaNode.name.value;
      options = {
        param1: `_meta.validate('${validateType}'::text, ("${refDbMetaCurrentTableColumn.name}")::text, '${gQlSchemaNode.value.value}'::text)`
      };
      constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_${validateType}_check`;
      break;
  }

  // getSqlFromMigrationObj new constraint if name was set
  if (constraintName != null) {
    const constraint = refDbMetaCurrentTable.constraints[constraintName] = refDbMetaCurrentTable.constraints[constraintName] || {
      type: constraintType,
      options,
    };

    // link constraint to field
    if (linkToColumn != null) {

      // getSqlFromMigrationObj columns field if not available
      constraint.columns = constraint.columns || [];

      // add column name to constraint
      constraint.columns.push(refDbMetaCurrentTableColumn.name);

      // add constraint to field
      refDbMetaCurrentTableColumn.constraintNames = refDbMetaCurrentTableColumn.constraintNames || [];
      refDbMetaCurrentTableColumn.constraintNames.push(constraintName);
      // keep them sorted for better comparison of objects
      refDbMetaCurrentTableColumn.constraintNames.sort();
    }

  }

}

function relationBuilderHelper(
  gQlDirectiveNode,
  dbMetaNode,
  refDbMeta,
  refDbMetaCurrentTable
) {

  const emptyRelation: IDbRelation = {
    name:              null,
    type:              null,
    schemaName:        null,
    tableName:         null,
    columnName:        null,
    virtualColumnName: null,
    onUpdate:          null,
    onDelete:          null,
    description:       null,
    reference: {
      schemaName: null,
      tableName:  null,
      columnName: null
    }
  };

  // find the right directive
  const relationDirective = gQlDirectiveNode.directives.find((directive) => {
    return (directive.name.value === 'relation');
  });

  let relationName            = null;
  let relationType            = null;
  const relationSchemaName    = refDbMetaCurrentTable.schemaName;
  const relationTableName     = refDbMetaCurrentTable.name;
  const virtualColumnName     = gQlDirectiveNode.name.value;
  let relationOnUpdate        = null;
  let relationOnDelete        = null;
  let referencedExposedName   = null;
  let referencedSchemaName    = null;
  let referencedTableName     = null;
  const referencedColumnName  = 'id'; // fk convention: always points to id

  // iterate arguments
  relationDirective.arguments.map((argument) => {
    const argumentName  = argument.name.value;
    const argumentValue = argument.value.value;
    switch (argumentName) {
      case 'name':
        relationName = argument.value.value;
        break;
      case 'onUpdate':
        switch (argumentValue.toLocaleLowerCase()) {
          case 'restrict':
            relationOnUpdate = 'RESTRICT';
            break;
          case 'cascade':
            relationOnUpdate = 'CASCADE';
            break;
          case 'set null':
            relationOnUpdate = 'SET NULL';
            break;
          case 'set default':
            relationOnUpdate = 'SET DEFAULT';
            break;
        }
        break;
      case 'onDelete':
        switch (argumentValue.toLocaleLowerCase()) {
          case 'restrict':
            relationOnDelete = 'RESTRICT';
            break;
          case 'cascade':
            relationOnDelete = 'CASCADE';
            break;
          case 'set null':
            relationOnDelete = 'SET NULL';
            break;
          case 'set default':
            relationOnDelete = 'SET DEFAULT';
            break;
        }
        break;
    }

    ((node) => {
      if (node.type.kind === 'NamedType') {
        relationType = 'ONE';
        referencedExposedName = _.get(gQlDirectiveNode, 'type.name.value');
      } else if (
        node.type.kind === 'NonNullType' &&
        node.type.type.kind === 'NamedType'
      ) {
        relationType = 'ONE';
        referencedExposedName = _.get(gQlDirectiveNode, 'type.type.name.value');
      } else if (
        node.type.kind === 'NonNullType' &&
        node.type.type.kind === 'ListType' &&
        node.type.type.type.kind === 'NonNullType' &&
        node.type.type.type.type.kind === 'NamedType'
      ) {
        relationType = 'MANY';
        referencedExposedName = _.get(gQlDirectiveNode, 'type.type.type.type.name.value');
      }
    })(gQlDirectiveNode);
  });

  // check if relation table exists
  if (refDbMeta.schemas[relationSchemaName].tables[relationTableName] == null ||
    refDbMeta.exposedNames[referencedExposedName] == null) {

    process.stderr.write(
      'GraphQL.parser.error.unknown.relation.table: ' + relationName + ':' + referencedExposedName + '\n'
    );
  } else {

    // get actual referenced table
    referencedSchemaName  = refDbMeta.exposedNames[referencedExposedName].schemaName;
    referencedTableName   = refDbMeta.exposedNames[referencedExposedName].tableName;

    const thisRelationName        = `${relationSchemaName}.${relationTableName}`;
    const referencedRelationName  = `${referencedSchemaName}.${referencedTableName}`;

    // get or getSqlFromMigrationObj new relations and keep reference for later
    const relations = refDbMeta.relations[relationName] = refDbMeta.relations[relationName] || {
      [thisRelationName]:     _.cloneDeep(emptyRelation),
      [referencedRelationName]: _.cloneDeep(emptyRelation)
    };
    const thisRelation  = relations[thisRelationName];
    const otherRelation = relations[referencedRelationName];

    // check if empty => more then one relation in GraphQl Error, maybe same name for different relations
    if (thisRelation == null || otherRelation == null) {
      process.stderr.write(
        'GraphQL.parser.error.relation.too.many: ' + relationName +
        ' Make sure to use unique relation names for different relations and use the same name on both sides of the relation. \n',
      );
      return;
    }

    // fill current relation
    thisRelation.name               = relationName;
    thisRelation.type               = relationType;
    thisRelation.schemaName         = relationSchemaName;
    thisRelation.tableName          = relationTableName;
    thisRelation.columnName         = (relationType === 'ONE') ?
                                        _referencingColumnNameHelper(virtualColumnName,
                                                                     referencedSchemaName,
                                                                     referencedTableName,
                                                                     referencedColumnName)
                                        : thisRelation.columnName;
    thisRelation.virtualColumnName  = virtualColumnName;
    thisRelation.onUpdate           = relationOnUpdate;
    thisRelation.onDelete           = relationOnDelete;
    // thisRelation.description        = null;
    thisRelation.reference.schemaName = referencedSchemaName;
    thisRelation.reference.tableName  = referencedTableName;
    thisRelation.reference.columnName = (relationType === 'MANY') ? null : referencedColumnName;

    // "invent" other side of relation if still empty
    // if other part of relation exists in GraphQL, it will get overridden with the actual data
    if (otherRelation.type == null) {
      // assume other side of relation is the opposite
      const referencedType = (relationType === 'ONE') ? 'MANY' : 'ONE';
      otherRelation.name               = relationName;
      otherRelation.type               = referencedType;
      otherRelation.schemaName         = referencedSchemaName;
      otherRelation.tableName          = referencedTableName;
      otherRelation.columnName         = (referencedType === 'ONE') ?
                                          _referencingColumnNameHelper(virtualColumnName,
                                                                       relationSchemaName,
                                                                       relationTableName,
                                                                       referencedColumnName)
                                          : otherRelation.columnName;
      // "invent" virtual column name by making plural (maybe a library later for real plurals)
      otherRelation.virtualColumnName  = relationTableName.toLowerCase() + 's';
      // otherRelation.onUpdate           = null; // can't be "invented"
      // otherRelation.onDelete           = null; // can't be "invented"
      // otherRelation.description        = null;
      otherRelation.reference.schemaName = relationSchemaName;
      otherRelation.reference.tableName  = relationTableName;
      otherRelation.reference.columnName = (referencedType === 'MANY') ? null : otherRelation.reference.columnName || 'id'; // fallback is 'id'
    }

    // adjust for MANY:MANY
    if (thisRelation.type === 'MANY' && otherRelation.type === 'MANY') {

      thisRelation.reference.columnName = referencedColumnName;
      thisRelation.columnName = _referencingColumnNameHelper(thisRelation.virtualColumnName,
                                                             thisRelation.reference.schemaName,
                                                             thisRelation.reference.tableName,
                                                             thisRelation.reference.columnName, true);

      otherRelation.reference.columnName = referencedColumnName;
      otherRelation.columnName = _referencingColumnNameHelper(otherRelation.virtualColumnName,
                                                              otherRelation.reference.schemaName,
                                                              otherRelation.reference.tableName,
                                                              otherRelation.reference.columnName, true);

    }

  }

  // fk column naming convention: {name}_{foreignTableName}_{foreignFieldName}
  function _referencingColumnNameHelper(pVirtualColumnName: string,
                                        pReferencedSchemaName: string,
                                        pReferencedTableName: string,
                                        pReferencedColumnName: string,
                                        pIsArray: boolean = false) {
    return (!pIsArray) ? `${pVirtualColumnName}Id` : `${pVirtualColumnName}IdsArray`;
  }

}

function addMigration(gQlDirectiveNode, dbMetaNode, refDbMeta) {
  const oldNameArgument = gQlDirectiveNode.arguments.find((argument) => {
    return (argument.name.value.toLowerCase() === 'from');
  });

  const oldName = (oldNameArgument != null) ? oldNameArgument.value.value : null;
  const newName = dbMetaNode.name;
  // add oldName to dbMeta node
  if (dbMetaNode != null && oldName != null) {
    dbMetaNode.oldName = oldName;
  }

  // check if node has schemaName (= table), if so, check for oldSchemaName
  if (dbMetaNode.schemaName != null) {
    const oldSchemaNameArgument = gQlDirectiveNode.arguments.find((argument) => {
      return (argument.name.value.toLowerCase() === 'fromschema');
    });
    const oldSchemaName = (oldSchemaNameArgument != null) ? oldSchemaNameArgument.value.value : null;

    // add oldSchemaName to dbMeta node
    if (dbMetaNode != null && oldSchemaName != null) {
      dbMetaNode.oldSchemaName = oldSchemaName;
    }
  }

}
