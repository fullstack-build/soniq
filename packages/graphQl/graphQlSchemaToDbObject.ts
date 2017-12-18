import * as _ from 'lodash';

import { IDbObject, IDbRelation } from '../core/IDbObject';

export const parseGraphQlJsonSchemaToDbObject = (graphQlJsonSchema): IDbObject => {
  const dbObject: IDbObject = {
    tables: {},
    relations: {},
    enums: {},
    views: []
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
    // FIRST:
    // create blank objects for all tables and enums (needed for validation of relationships)
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      const typeName = gQlJsonSchemaDocumentNode.name.value;
      // table
      if (gQlJsonSchemaDocumentNode.kind === 'ObjectTypeDefinition') {
        // create tableObject in dbObject
        refDbObj.tables[typeName] = {
          name: typeName,
          isDbModel: false,
          schemaName: 'public',
          constraints: {}
        };
      } else if (gQlJsonSchemaDocumentNode.kind === 'EnumTypeDefinition') {
        refDbObj.enums[typeName] = [];
      }

    });

    // SECOND:
    // parse all documents recursively
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      parseGraphQlJsonNode(gQlJsonSchemaDocumentNode, dbObjectNode, refDbObj);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (gQlSchemaDocumentNode, dbObjectNode, refDbObj) => {
    // get table name from typeDefinition
    const tableName = gQlSchemaDocumentNode.name.value;

    // and save ref to tableObject for recursion
    const refDbObjectCurrentTable = dbObjectNode.tables[tableName];

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
  EnumTypeDefinition: (
    gQlEnumTypeDefinitionNode,
    dbObjectNode,
    refDbObj
  ) => {
    const enumName = gQlEnumTypeDefinitionNode.name.value;
    const enumValues = gQlEnumTypeDefinitionNode.values.reduce((values, gQlEnumTypeDefinitionNodeValue) => {
      values.push(gQlEnumTypeDefinitionNodeValue.name.value);
      return values;
    },                                                         []);

    dbObjectNode.enums[enumName] = enumValues;
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (
    gQlFieldDefinitionNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
  ) => {
    // create columns object if not set already
    dbObjectNode.columns = dbObjectNode.columns || [];

    const newField = {
      constraintNames: []
    };
    // add new column ref to dbObject
    // newField will now update data in the dbObject through this ref
    dbObjectNode.columns.push(newField);

    // check if column is relation
    if (
      _.get(gQlFieldDefinitionNode, 'directives[0].name.value') === 'relation'
    ) {
      // handle relation
     relationBuilderHelper(
        gQlFieldDefinitionNode,
        dbObjectNode,
        refDbObj,
        refDbObjectCurrentTable,
        newField,
      );
    } else {
      // handle normal column

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
    let dbType = 'varchar';
    let customType = null;
    // types
    // GraphQl: http://graphql.org/graphql-js/basic-types/
    // PG: https://www.postgresql.org/docs/current/static/datatype.html
    switch (columnType) {
      case 'id':
        // set type to uuid
        dbType = 'uuid';
        // add new PK constraint
        addConstraint('primaryKey',
                      gQlSchemaNode,
                      dbObjectNode,
                      refDbObj,
                      refDbObjectCurrentTable,
                      refDbObjectCurrentTableColumn);
        break;
      case 'string':
        dbType = 'varchar';
        break;
      case 'int':
        dbType = 'int';
        break;
      case 'float':
        dbType = 'float8';
        break;
      case 'boolean':
        dbType = 'bool';
        break;
      case 'json':
        dbType = 'jsonb';
        break;
      default:
        // check dynamic types
        // enum?
        const enumNames = Object.keys(refDbObj.enums);
        const enumNamesInLowerCase = enumNames.map(enumName => enumName.toLowerCase());
        const typeEnumIndex = enumNamesInLowerCase.indexOf(columnType);
        if (typeEnumIndex !== -1) {
          // enum
          dbType = 'enum';
          customType = enumNames[typeEnumIndex];
        } else {
          // unknown type
          process.stderr.write(
            'GraphQL.parser.error.unknown.field.type: ' + refDbObjectCurrentTable.name + '.' + columnType + '\n',
          );
        }
        break;
    }

    // set column name
    dbObjectNode.type = dbType;
    dbObjectNode.customType = customType;

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

  // parse Directive
  Directive: (
    gQlDirectiveNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableColumn,
  ) => {
    const directiveKind = gQlDirectiveNode.name.value;
    switch (directiveKind) {
      case 'table':
        dbObjectNode.isDbModel = true;
        break;
      case 'isUnique':

        addConstraint('unique',
                      gQlDirectiveNode,
                      dbObjectNode,
                      refDbObj,
                      refDbObjectCurrentTable,
                      refDbObjectCurrentTableColumn);
        break;
      case 'check': // native PG check constraint
        // iterate over all constraints
        gQlDirectiveNode.arguments.forEach((argument) => {
          addConstraint('check',
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
      case 'schema': // additional jscon schema validation
        dbObjectNode.schemaName = _.get(gQlDirectiveNode, 'arguments[0].value.value');
        break;
      case 'type': // override type with PG native type
        dbObjectNode.type = 'customType';
        dbObjectNode.customType = _.get(gQlDirectiveNode, 'arguments[0].value.value');
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

function addConstraint(constraintType,
                       gQlSchemaNode,
                       dbObjectNode,
                       refDbObj,
                       refDbObjectCurrentTable,
                       refDbObjectCurrentTableColumn) {

  let constraintName  = null;
  let options         = {};
  switch (constraintType) {
    case 'unique':
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_key`;
      // named unique constraint - override
      if (gQlSchemaNode.arguments[0] != null && gQlSchemaNode.arguments[0].name.value === 'name') {
        const namedConstraintName = gQlSchemaNode.arguments[0].value.value;
        constraintName = `${refDbObjectCurrentTable.name}_${namedConstraintName}_key`;
      }
      break;
    case 'primaryKey':
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_pkey`;
      break;
    case 'not_null':
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_notnull`;
      break;
    case 'check':
      const checkName = gQlSchemaNode.name.value;
      options = {
        param1: gQlSchemaNode.value.value
      };
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_${checkName}_check`;
      break;
    case 'validate':
      const validateType = gQlSchemaNode.name.value;
      options = {
        param1: validateType,
        param2: gQlSchemaNode.value.value
      };
      constraintName = `${refDbObjectCurrentTable.name}_${refDbObjectCurrentTableColumn.name}_${validateType}_validator`;
    break;
  }

  // create new constraint if name was set
  if (constraintName != null) {
    const constraint = refDbObjectCurrentTable.constraints[constraintName] = refDbObjectCurrentTable.constraints[constraintName] || {
      type: constraintType,
      options,
      columns: []
    };
    // add column name to constraint
    constraint.columns.push(refDbObjectCurrentTableColumn.name);

    // add constraint to field
    refDbObjectCurrentTableColumn.constraintNames.push(constraintName);
  }

}

function relationBuilderHelper(
  gQlDirectiveNode,
  dbObjectNode,
  refDbObj,
  refDbObjectCurrentTable,
  refDbObjectCurrentTableColumn,
) {
  // create relation
  const relation: IDbRelation = {
    name: null,
    schemaName: 'public', // for now everything is public
    tableName: refDbObjectCurrentTable.name,
    virtualColumnName: gQlDirectiveNode.name.value,
    columnName: null,
    type: null,
    onDelete: null,
    onUpdate: null,
    // Name of the association
    description: null,
    // joins to
    reference: {
      schemaName: 'public', // for now everything is public
      tableName: null,
      columnName: 'id' // convention: always reference ID pk
    }
  };

  // find the right directive
  const relationDirective = gQlDirectiveNode.directives.filter((directive) => {
    return (directive.name.value === 'relation');
  })[0];

  // iterate arguments
  relationDirective.arguments.map((argument) => {
    const argumentName  = argument.name.value;
    const argumentValue = argument.value.value;
    switch (argumentName) {
      case 'name':
        relation.name = argument.value.value;
      break;
      case 'onDelete':
        switch (argumentValue.toLocaleLowerCase()) {
          case 'restrict':
            relation.onDelete = 'restrict';
            break;
          case 'cascade':
            relation.onDelete = 'cascade';
            break;
          case 'set null':
            relation.onDelete = 'set NULL';
            break;
          case 'set default':
            relation.onDelete = 'set DEFAULT';
            break;
        }
        break;
      case 'onUpdate':
        switch (argumentValue.toLocaleLowerCase()) {
          case 'restrict':
            relation.onUpdate = 'restrict';
            break;
          case 'cascade':
            relation.onUpdate = 'cascade';
            break;
          case 'set null':
            relation.onUpdate = 'set NULL';
            break;
          case 'set default':
            relation.onUpdate = 'set DEFAULT';
            break;
        }
        break;
    }

    ((node) => {
      if (node.type.kind === 'NamedType') {
        relation.type = 'ONE';
        relation.reference.tableName = _.get(gQlDirectiveNode, 'type.name.value');
      } else if (
        node.type.kind === 'NonNullType' &&
        node.type.type.kind === 'NamedType'
      ) {
        relation.type = 'ONE';
        relation.reference.tableName = _.get(gQlDirectiveNode, 'type.type.name.value');
      } else if (
        node.type.kind === 'NonNullType' &&
        node.type.type.kind === 'ListType' &&
        node.type.type.type.kind === 'NonNullType' &&
        node.type.type.type.type.kind === 'NamedType'
      ) {
        relation.type = 'MANY';
        relation.reference.tableName = _.get(gQlDirectiveNode, 'type.type.type.type.name.value');
      }
    })(gQlDirectiveNode);
  });

  // check if relation table exists
  if (refDbObj.tables[relation.reference.tableName] == null) {

    process.stderr.write(
      'GraphQL.parser.error.unknown.relation.table: ' +
      relation.tableName + '.' + relation.virtualColumnName + ' ' + relation.reference.tableName + '\n'
    );
  } else {

    // fk column naming convention: {name}_{foreignTableName}_{foreignFieldName}
    relation.columnName = `${relation.virtualColumnName}_${relation.reference.tableName}_${relation.reference.columnName}`;

    // update column information, save link to relation information
    // set relation name
    refDbObjectCurrentTableColumn.name = relation.virtualColumnName;
    // mark column as relation
    refDbObjectCurrentTableColumn.type = 'relation';
    // set relation name for column
    refDbObjectCurrentTableColumn.relationName = relation.name;
    // create relation in dbObject if not set yet and push relation into array
    refDbObj.relations[relation.name] = refDbObj.relations[relation.name] || [];
    refDbObj.relations[relation.name].push(relation);

  }
}
