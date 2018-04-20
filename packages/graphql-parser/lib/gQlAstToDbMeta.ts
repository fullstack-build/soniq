import * as _ from 'lodash';
import { readdirSync } from 'fs';

import { IDbMeta, IDbRelation } from '@fullstack-one/db';
import { setDefaultValueForColumn, setAuthValueForColumn, addConstraint, addMigration, relationBuilderHelper } from './gQlAstToDbMetaHelper';

// Directive Parse
interface IDirectiveParser {
  [name: string]: (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => void;
}
const directiveParser: IDirectiveParser = {};

export const registerDirectiveParser = (nameInLowerCase: string,
                                        fn: (gQlDirectiveNode,
                                             dbMetaNode,
                                             refDbMeta,
                                             refDbMetaCurrentTable,
                                             refDbMetaCurrentTableColumn) => void): void => {
  directiveParser[nameInLowerCase] = fn;
};

export const parseGQlAstToDbMeta = (graphQlJsonSchema): IDbMeta => {
  const dbMeta: IDbMeta = {
    version: 1.0,
    schemas: {},
    enums: {},
    relations: {},
    exposedNames: {}
  };

  // load existing directive parser
  require('./gQlAstToDbMetaDirectiveParser');

  // start parsing
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
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode: any) => {
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
    const directiveKindLowerCase = directiveKind.toLocaleLowerCase();

    // execute dynamic directive parser
    if (directiveParser[directiveKindLowerCase] != null) {
      directiveParser[directiveKindLowerCase](gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    } else {
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
        const foundEnum: any = Object.values(refDbMeta.enums).find((enumObj: any) => {
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
