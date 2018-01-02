import * as _ from 'lodash';

import { IDbObject, IMaxTwoRelations, IDbRelation } from '../core/IDbObject';

export const parseGraphQlJsonSchemaToDbObject = (graphQlJsonSchema): IDbObject => {
  const dbObject: IDbObject = {
    schemas: {},
    enums: {},
    relations: {},
    exposedNames: {}
  };
  parseGraphQlJsonNode(graphQlJsonSchema, dbObject);
  // return copy instead of ref
  return { ...dbObject };
};

// refDbObjectCurrentTable:
//  - ref to current parent table obj will be passed through all iterations after table was added
// refDbObjectCurrentTableColumn:
// - ref to current parent table column obj will be passed through all iterations
//   after table column was added
function parseGraphQlJsonNode(
  gQlSchemaNode,
  dbObjectNode,
  dbObject?,
  refDbObjectCurrentTable?,
  refDbObjectCurrentTableColumn?,
) {
  // ref to dbObject will be passed through all iterations
  const refDbObj = dbObject || dbObjectNode;

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
      dbObjectNode,
      refDbObj,
      refDbObjectCurrentTable,
      refDbObjectCurrentTableColumn,
    );
  }
}

const GQL_JSON_PARSER = {
  // iterate over all type definitions
  Document: (gQlSchemaNode, dbObjectNode, refDbObj) => {

    // FIRST round:
    // create blank objects for all tables and enums (needed for validation of relationships)
    // but don't continue recursively
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      // type
      if (gQlJsonSchemaDocumentNode.kind === 'ObjectTypeDefinition') {
        GQL_JSON_PARSER.ObjectTypeDefinition(gQlJsonSchemaDocumentNode, dbObjectNode, refDbObj, false);

      } else if (gQlJsonSchemaDocumentNode.kind === 'EnumTypeDefinition') {
        // convention: enums are global
        GQL_JSON_PARSER.EnumTypeDefinition(gQlJsonSchemaDocumentNode, dbObjectNode, refDbObj);
      }
    });

    // SECOND round:
    // parse all documents recursively
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      parseGraphQlJsonNode(gQlJsonSchemaDocumentNode, dbObjectNode, refDbObj);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (gQlSchemaDocumentNode, dbObjectNode, refDbObj, continueRecursively: boolean = true) => {

    const typeName = gQlSchemaDocumentNode.name.value;

    // find table directive
    const dbDirective = gQlSchemaDocumentNode.directives.filter((directive) => {
      return (directive.kind === 'Directive' && directive.name.value === 'table');
    })[0];

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

    // find or create schema
    refDbObj.schemas[schemaName] = refDbObj.schemas[schemaName] || {
      tables:{},
      views: []
    };

    // find or create table in schema
    // and save ref to tableObject for recursion
    const refDbObjectCurrentTable = refDbObj.schemas[schemaName].tables[tableName] = refDbObj.schemas[schemaName].tables[tableName] || {
      schemaName,
      name: tableName,
      description: null,
      constraints: {}
    };

    // add exposed name to list with reference to underlying table
    refDbObj.exposedNames[typeName] = {
      schemaName: refDbObjectCurrentTable.schemaName,
      tableName: refDbObjectCurrentTable.name
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
              refDbObjectCurrentTable,
              refDbObj,
              refDbObjectCurrentTable,
            );
          },
        );
      }
    });
  },

  // parse EnumType
  EnumTypeDefinition: (gQlEnumTypeDefinitionNode,
                       dbObjectNode,
                       refDbObj) => {
    const enumName = gQlEnumTypeDefinitionNode.name.value;
    const enumValues = gQlEnumTypeDefinitionNode.values.reduce((values, gQlEnumTypeDefinitionNodeValue) => {
      values.push(gQlEnumTypeDefinitionNodeValue.name.value);
      return values;
    },                                                         []);

    // convention enums are DB wide
    dbObjectNode.enums[enumName] = enumValues;
  },

  // parse Directive
  Directive: (gQlDirectiveNode,
              dbObjectNode,
              refDbObj,
              refDbObjectCurrentTable,
              refDbObjectCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    switch (directiveKind) {
      case 'table':
        // nothing to do here -> has been done in ObjectTypeDefinition
        break;
      case 'isUnique':

        addConstraint('UNIQUE',
                      gQlDirectiveNode,
                      dbObjectNode,
                      refDbObj,
                      refDbObjectCurrentTable,
                      refDbObjectCurrentTableColumn);
        break;
      case 'check': // native PG check constraint
        // iterate over all constraints
        gQlDirectiveNode.arguments.forEach((argument) => {
          addConstraint('CHECK',
                        argument,
                        dbObjectNode,
                        refDbObj,
                        refDbObjectCurrentTable,
                        refDbObjectCurrentTableColumn);
        });
        break;
      case 'validate': // validate constraint

        // iterate over all constraints
        gQlDirectiveNode.arguments.forEach((argument) => {
          addConstraint('validate',
                        argument,
                        dbObjectNode,
                        refDbObj,
                        refDbObjectCurrentTable,
                        refDbObjectCurrentTableColumn);
        });
        break;
      case 'computed': // mark as computed
        dbObjectNode.type = 'computed';
        break;
      case 'custom': // mark as customResolver
        dbObjectNode.type = 'customResolver';
        break;
      case 'type': // override type with PG native type
        const customType = _.get(gQlDirectiveNode, 'arguments[0].value.value');
        // detect known PG types
        switch (customType) {
          case 'Date':
            dbObjectNode.type = 'date';
            break;
          default:
            dbObjectNode.type = 'customType';
            dbObjectNode.customType = customType;
            break;
        }
        break;
      case 'default': // set default value
        setDefaultValueForColumn(gQlDirectiveNode,
                                 dbObjectNode,
                                 refDbObj,
                                 refDbObjectCurrentTable,
                                 refDbObjectCurrentTableColumn);
        break;
      default:
        process.stderr.write(
          'GraphQL.parser.error.unknown.directive.kind: ' +
          refDbObjectCurrentTable.name + '.' + refDbObjectCurrentTableColumn.name + '.' + directiveKind + '\n',
        );
        break;
    }
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (
    gQlFieldDefinitionNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
  ) => {
    // create columns object if not set already
    dbObjectNode.columns = dbObjectNode.columns || {};

    // check if column is relation
    if (_.get(gQlFieldDefinitionNode, 'directives[0].name.value') === 'relation') {
      // handle relation
     relationBuilderHelper(
        gQlFieldDefinitionNode,
        dbObjectNode,
        refDbObj,
        refDbObjectCurrentTable
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
            refDbObj,
            refDbObjectCurrentTable,
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
                refDbObj,
                refDbObjectCurrentTable,
                newField,
              );
            },
          );
        }
      });

      // add new column ref to dbObject
      // newField will now update data in the dbObject through this ref
      dbObjectNode.columns[newField.name] = newField;
    }

  },

  // parse Name kind
  Name: (
    gQlSchemaNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableColumn,
  ) => {
    if (gQlSchemaNode != null && dbObjectNode != null) {
      // set column name
      dbObjectNode.name = gQlSchemaNode.value;
    }
  },

  // parse NamedType kind
  NamedType: (
    gQlSchemaNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableColumn,
  ) => {
    const columnType = gQlSchemaNode.name.value.toLocaleLowerCase();
    dbObjectNode.type = 'varchar';
    // types
    // GraphQl: http://graphql.org/graphql-js/basic-types/
    // PG: https://www.postgresql.org/docs/current/static/datatype.html
    switch (columnType) {
      case 'id':
        // set type to uuid
        dbObjectNode.type = 'uuid';
        dbObjectNode.defaultValue = {
          isExpression: true,
          value: 'uuid_generate_v4()'
        };
        // add new PK constraint
        addConstraint('PRIMARY KEY',
                      gQlSchemaNode,
                      dbObjectNode,
                      refDbObj,
                      refDbObjectCurrentTable,
                      refDbObjectCurrentTableColumn);
        break;
      case 'string':
        dbObjectNode.type = 'varchar';
        break;
      case 'int':
        dbObjectNode.type = 'int';
        break;
      case 'float':
        dbObjectNode.type = 'float8';
        break;
      case 'boolean':
        dbObjectNode.type = 'bool';
        break;
      case 'json':
        dbObjectNode.type = 'jsonb';
        break;
      default:
        // check dynamic types
        // enum?
        const enumNames = Object.keys(refDbObj.enums);
        const enumNamesInLowerCase = enumNames.map(enumName => enumName.toLowerCase());
        const typeEnumIndex = enumNamesInLowerCase.indexOf(columnType);
        if (typeEnumIndex !== -1) {
          // enum
          dbObjectNode.type = 'enum';
          dbObjectNode.customType = enumNames[typeEnumIndex];
        } else {
          // unknown type
          process.stderr.write(
            'GraphQL.parser.error.unknown.field.type: ' + refDbObjectCurrentTable.name + '.' + columnType + '\n',
          );
        }
        break;
    }

  },

  // parse NonNullType kind
  NonNullType: (
    gQlSchemaNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableColumn,
  ) => {
    // add new constraint
    addConstraint('not_null',
                  gQlSchemaNode,
                  dbObjectNode,
                  refDbObj,
                  refDbObjectCurrentTable,
                  refDbObjectCurrentTableColumn);

    // parse sub type
    if (gQlSchemaNode.type != null) {
      const gQlSchemaTypeNode = gQlSchemaNode.type;
      parseGraphQlJsonNode(
        gQlSchemaTypeNode,
        dbObjectNode,
        refDbObj,
        refDbObjectCurrentTable,
        refDbObjectCurrentTableColumn,
      );
    }
  },

  // set list type
  ListType: (
    gQlSchemaTypeNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableColumn,
  ) => {
    dbObjectNode.type = 'jsonb';
    dbObjectNode.defaultValue = {};
  },

  // parse Argument
  Argument: (
    gQlNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableColumn,
  ) => {
    // set argument name and value
    if (gQlNode != null && dbObjectNode != null) {
      dbObjectNode[gQlNode.name.value] = gQlNode.value.value;
    }
  }
};

function setDefaultValueForColumn(gQlSchemaNode,
                                  dbObjectNode,
                                  refDbObj,
                                  refDbObjectCurrentTable,
                                  refDbObjectCurrentTableColumn) {

  const isExpression = (_.get(gQlSchemaNode, 'arguments[0].name.value').toLocaleLowerCase() === 'expression');
  const defaultValue = _.get(gQlSchemaNode, 'arguments[0].value.value');
  // add default object to column
  refDbObjectCurrentTableColumn.defaultValue = {
    isExpression,
    value: defaultValue
  };

}

function addConstraint(pConstraintType,
                       gQlSchemaNode,
                       dbObjectNode,
                       refDbObj,
                       refDbObjectCurrentTable,
                       refDbObjectCurrentTableColumn) {

  let constraintType = pConstraintType;
  let constraintName  = null;
  let options         = {};
  let linkToColumn    = null;
  switch (constraintType) {
    case 'not_null':
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_not_null`;
      // link this constraint to a column
      linkToColumn  = refDbObjectCurrentTableColumn.name;
      break;
    case 'UNIQUE':
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_key`;
      // named unique constraint - override
      if (gQlSchemaNode.arguments[0] != null && gQlSchemaNode.arguments[0].name.value === 'name') {
        const namedConstraintName = gQlSchemaNode.arguments[0].value.value;
        constraintName = `${refDbObjectCurrentTable.name}_${namedConstraintName}_key`;
      }
      // link this constraint to a column
      linkToColumn  = refDbObjectCurrentTableColumn.name;
      break;
    case 'PRIMARY KEY':
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_pkey`;
      // link this constraint to a column
      linkToColumn  = refDbObjectCurrentTableColumn.name;
      break;
    case 'CHECK':
      const checkName = gQlSchemaNode.name.value;
      options = {
        param1: gQlSchemaNode.value.value
      };
      constraintName = `${refDbObjectCurrentTable.name}_${checkName}_check`;
      break;
    case 'validate':
      constraintType = 'CHECK'; // validate turns into check
      const validateType = gQlSchemaNode.name.value;
      options = {
        param1: `_meta.validate('${validateType}'::text, (${refDbObjectCurrentTableColumn.name})::text, '${gQlSchemaNode.value.value}'::text)`
      };
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_${validateType}_check`;
    break;
  }

  // create new constraint if name was set
  if (constraintName != null) {
    const constraint = refDbObjectCurrentTable.constraints[constraintName] = refDbObjectCurrentTable.constraints[constraintName] || {
      type: constraintType,
      options,
    };

    // link constraint to field
    if (linkToColumn != null) {

      // create columns field if not available
      constraint.columns = constraint.columns || [];

      // add column name to constraint
      constraint.columns.push(refDbObjectCurrentTableColumn.name);

      // add constraint to field
      refDbObjectCurrentTableColumn.constraintNames = refDbObjectCurrentTableColumn.constraintNames || [];
      refDbObjectCurrentTableColumn.constraintNames.push(constraintName);
    }

  }

}

function relationBuilderHelper(
  gQlDirectiveNode,
  dbObjectNode,
  refDbObj,
  refDbObjectCurrentTable
) {

  // find the right directive
  const relationDirective = gQlDirectiveNode.directives.filter((directive) => {
    return (directive.name.value === 'relation');
  })[0];

  let relationName            = null;
  let relationType            = null;
  const relationSchemaName    = refDbObjectCurrentTable.schemaName;
  const relationTableName     = refDbObjectCurrentTable.name;
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
  if (refDbObj.schemas[relationSchemaName].tables[relationTableName] == null ||
    refDbObj.exposedNames[referencedExposedName] == null) {

    process.stderr.write(
      'GraphQL.parser.error.unknown.relation.table: ' + relationName + ':' + referencedExposedName + '\n'
    );
  } else {

    // get actual referenced table
    referencedSchemaName  = refDbObj.exposedNames[referencedExposedName].schemaName;
    referencedTableName   = refDbObj.exposedNames[referencedExposedName].tableName;

    const relations = _getOrCreateEmptyRelation(refDbObj, relationName);
    const orderedRelations = relations.reduce((result: any, relation: IDbRelation) => {
        // take either the first empty one, or for the current schema and table
        if (
          (relation.type == null && result.thisRelation == null)
          ||
          (relation.schemaName === relationSchemaName && relation.tableName === relationTableName)
        ) {
          result.thisRelation = relation;
        } else {
          result.otherRelation = relation;
        }
        return result;
      },                                      { thisRelation: null, otherRelation: null });
    const thisRelation  = orderedRelations.thisRelation;
    const otherRelation = orderedRelations.otherRelation;

    // check if empty => more then one relation in GraphQl Error
    if (thisRelation == null) {
      process.stderr.write(
        'GraphQL.parser.error.relation.too.many: ' + relationName + '\n',
      );
      return;
    }

    // fill current relation
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
      otherRelation.reference.columnName = (referencedType === 'MANY') ? null : otherRelation.reference.columnName;
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

  function _getOrCreateEmptyRelation(pRefDbObj: IDbObject, pRelationName: string): IMaxTwoRelations {

    const emptyRelation: IDbRelation = {
      name:              pRelationName,
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

    // create relation in dbObject if it doesn't exist yet
    if (pRefDbObj.relations[pRelationName] == null) {
      pRefDbObj.relations[pRelationName] = [_.cloneDeep(emptyRelation), _.cloneDeep(emptyRelation)];
    }

    // return relation reference
    return pRefDbObj.relations[pRelationName];
  }

}
