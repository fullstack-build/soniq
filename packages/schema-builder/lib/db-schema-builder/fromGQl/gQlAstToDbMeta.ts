import * as _ from "lodash";

import { IDbMeta, IDbRelation } from "../IDbMeta";
import { setDefaultValueForColumn, addMigration, relationBuilderHelper, createConstraint } from "./gQlAstToDbMetaHelper";

import { getDirectiveParser } from "./directiveParser";
import { DocumentNode, ObjectTypeDefinitionNode, EnumTypeDefinitionNode, ArgumentNode, ASTNode, FieldDefinitionNode, NameNode, NamedTypeNode, NonNullTypeNode, ListTypeNode, DirectiveNode } from "graphql";
export { registerDirectiveParser } from "./directiveParser";

export function parseGQlAstToDbMeta(gQlAST: DocumentNode): IDbMeta {
  // result dbMeta
  const dbMeta: IDbMeta = {
    version: 1.0,
    schemas: {},
    enums: {},
    relations: {},
    exposedNames: {}
  };

  // load existing directive parser
  require("./initialDirectiveParser");

  // start parsing
  parseASTNode(gQlAST, dbMeta);

  // update relational column names
  changeVirtualColumnNamesToActualColumnNamesForRelations(dbMeta);

  // return copy instead of ref
  return _.cloneDeep(dbMeta);
};

// refDbMetaCurrentTable:
//  - ref to current parent table obj will be passed through all iterations after table was added
// refDbMetaCurrentTableColumn:
// - ref to current parent table column obj will be passed through all iterations
//   after table column was added
function parseASTNode(gQlSchemaNode: ASTNode, dbMetaNode, dbMeta?, refDbMetaCurrentTable?, refDbMetaCurrentTableColumn?) {
  // ref to dbMeta will be passed through all iterations
  const refDbMeta = dbMeta || dbMetaNode;

  // dynamic parser loader
  if (gQlSchemaNode == null || gQlSchemaNode.kind == null) {
    // ignore empty nodes or nodes without a kind
  } else if (GQL_JSON_PARSER[gQlSchemaNode.kind] == null) {
    process.stderr.write(`GraphQL.parser.error.unknown.type: ${gQlSchemaNode.kind}\n`);
  } else {
    // parse
    GQL_JSON_PARSER[gQlSchemaNode.kind](gQlSchemaNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
  }
}

const GQL_JSON_PARSER = {
  // iterate over all type definitions
  Document: (gQlDocumentNode: DocumentNode, dbMetaNode, refDbMeta): void => {
    // FIRST round:
    // add blank objects for all tables and enums (needed for validation of relationships)
    // but don't continue recursively
    Object.values(gQlDocumentNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      // type
      if (gQlJsonSchemaDocumentNode.kind === "ObjectTypeDefinition") {
        GQL_JSON_PARSER.ObjectTypeDefinition(gQlJsonSchemaDocumentNode, dbMetaNode, refDbMeta, false);
      } else if (gQlJsonSchemaDocumentNode.kind === "EnumTypeDefinition") {
        // convention: enums are global
        GQL_JSON_PARSER.EnumTypeDefinition(gQlJsonSchemaDocumentNode, dbMetaNode, refDbMeta);
      }
    });

    // SECOND round:
    // parse all documents recursively
    Object.values(gQlDocumentNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      parseASTNode(gQlJsonSchemaDocumentNode, dbMetaNode, refDbMeta);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (gQlObjectTypeDefinitionNode: ObjectTypeDefinitionNode, dbMetaNode, refDbMeta, continueRecursively: boolean = true): void => {
    const typeName = gQlObjectTypeDefinitionNode.name.value;
    // find table directive
    const tableDirective = gQlObjectTypeDefinitionNode.directives.find((directive) => {
      return directive.kind === "Directive" && directive.name.value === "table";
    });

    // ignore if not a table definition
    if (tableDirective == null) {
      return;
    }

    const schemaAndTableName = tableDirective.arguments.reduce(
      (result, argument: any) => {
        result.schemaName = argument.name.value === "schemaName" ? argument.value.value : result.schemaName;
        result.tableName = argument.name.value === "tableName" ? argument.value.value : result.tableName;
        return result;
      },
      { schemaName: null, tableName: null }
    );

    const schemaName = schemaAndTableName.schemaName || "public";
    const tableName = schemaAndTableName.tableName || typeName;

    // find or add schema
    refDbMeta.schemas[schemaName] = refDbMeta.schemas[schemaName] || {
      name: schemaName,
      tables: {},
      views: []
    };

    // find or add table in schema
    // and save ref to tableObject for recursion
    const refDbMetaCurrentTable = (refDbMeta.schemas[schemaName].tables[tableName] = refDbMeta.schemas[schemaName].tables[tableName] || {
      schemaName,
      name: tableName,
      description: null,
      constraints: {},
      extensions: {}
    });

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
    Object.values(gQlObjectTypeDefinitionNode).map((gQlSchemaDocumentNodeProperty) => {
      // iterate over sub nodes (e.g. interfaces, fields, directives
      if (Array.isArray(gQlSchemaDocumentNodeProperty)) {
        Object.values(gQlSchemaDocumentNodeProperty).map((gQlSchemaDocumentSubnode) => {
          // parse sub node
          parseASTNode(gQlSchemaDocumentSubnode, refDbMetaCurrentTable, refDbMeta, refDbMetaCurrentTable);
        });
      }
    });
  },

  // parse EnumType
  EnumTypeDefinition: (gQlEnumTypeDefinitionNode: EnumTypeDefinitionNode, dbMetaNode, refDbMeta): void => {
    const enumName = gQlEnumTypeDefinitionNode.name.value;
    const enumValues = gQlEnumTypeDefinitionNode.values.reduce<string[]>((values, gQlEnumValueDefinitionNode) => {
      values.push(gQlEnumValueDefinitionNode.name.value);
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
  Directive: (gQlDirectiveNode: DirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    const directiveKind = gQlDirectiveNode.name.value;
    const directiveKindLowerCase = directiveKind.toLocaleLowerCase();

    // execute dynamic directive parser
    if (getDirectiveParser(directiveKindLowerCase) != null) {
      getDirectiveParser(directiveKindLowerCase)(gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    } else {
      let pathToDirective = "";
      if (refDbMetaCurrentTable != null && refDbMetaCurrentTable.name) {
        pathToDirective = refDbMetaCurrentTable.name;
      }
      if (refDbMetaCurrentTableColumn != null && refDbMetaCurrentTableColumn.name) {
        pathToDirective += `.${refDbMetaCurrentTableColumn.name}`;
      }

      process.stderr.write(`GraphQL.parser.error.unknown.directive.kind: ${pathToDirective}.${directiveKind}\n`);
    }
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (gQlFieldDefinitionNode: FieldDefinitionNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable) => {
    // add columns object if not set already
    dbMetaNode.columns = dbMetaNode.columns || {};

    // handle normal column
    const newColumn = {
      name: null,
      type: null,
      description: null,
      extensions: {}
    };

    // check if column is relation
    if (_.get(gQlFieldDefinitionNode, "directives[0].name.value") === "relation") {
      // handle relation
      const relation = relationBuilderHelper(gQlFieldDefinitionNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable);
    }

    // parse FieldDefinition properties
    Object.values(gQlFieldDefinitionNode).map((gQlSchemaFieldNodeProperty) => {
      if (typeof gQlSchemaFieldNodeProperty === "object" && !Array.isArray(gQlSchemaFieldNodeProperty)) {
        // object

        // parse sub node
        parseASTNode(gQlSchemaFieldNodeProperty, newColumn, refDbMeta, refDbMetaCurrentTable, newColumn);
      } else if (typeof gQlSchemaFieldNodeProperty === "object" && !!Array.isArray(gQlSchemaFieldNodeProperty)) {
        // array

        // iterate over sub nodes (e.g. arguments, directives
        Object.values(gQlSchemaFieldNodeProperty).map((gQlSchemaFieldSubnode) => {
          // parse sub node
          parseASTNode(gQlSchemaFieldSubnode, newColumn, refDbMeta, refDbMetaCurrentTable, newColumn);
        });
      }
    });

    // add new column ref to dbMeta
    // newField will now update data in the dbMeta through this ref
    dbMetaNode.columns[newColumn.name] = newColumn;
  },

  // parse Name kind
  Name: (gQlNameNode: NameNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    if (gQlNameNode != null && dbMetaNode != null) {
      // set column name
      dbMetaNode.name = gQlNameNode.value;
    }
  },

  // parse NamedType kind
  NamedType: (gQlNamedTypeNode: NamedTypeNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // set column type
    const columnTypeLowerCase = gQlNamedTypeNode.name.value.toLocaleLowerCase();
    dbMetaNode.type = "varchar";
    // types
    // GraphQl: http://graphql.org/graphql-js/basic-types/
    // PG: https://www.postgresql.org/docs/current/static/datatype.html
    switch (columnTypeLowerCase) {
      case "id":
        // set type to uuid
        dbMetaNode.type = "uuid";
        dbMetaNode.defaultValue = {
          // former uuid_generate_v4(), now a wrapper for INSERTS without SELECT permissions
          value: "_meta.uuid_generate_v4()"
        };
        // add new PK constraint
        const constraintNamePk = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_pkey`;
        createConstraint(constraintNamePk, "PRIMARY KEY", {}, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);

        break;
      case "uuid":
        dbMetaNode.type = "uuid";
        break;
      case "string":
        dbMetaNode.type = "varchar";
        break;
      case "int":
        dbMetaNode.type = "int4";
        break;
      case "float":
        dbMetaNode.type = "float8";
        break;
      case "boolean":
        dbMetaNode.type = "bool";
        break;
      case "json":
        dbMetaNode.type = "json";
        break;
      case "jsonb":
        dbMetaNode.type = "jsonb";
        break;
      default:
        // check dynamic types
        // enum?
        const foundEnum: any = Object.values(refDbMeta.enums).find((enumObj: any) => {
          return enumObj.name.toLowerCase() === columnTypeLowerCase;
        });
        if (foundEnum != null) {
          // enum
          dbMetaNode.type = "enum";
          dbMetaNode.customType = foundEnum.name;

          // add column name to enum columns list
          if (refDbMetaCurrentTable.schemaName != null && refDbMetaCurrentTable.name != null && refDbMetaCurrentTableColumn.name != null) {
            const enumColumnName = `${refDbMetaCurrentTable.schemaName}.${refDbMetaCurrentTable.name}.${refDbMetaCurrentTableColumn.name}`;

            foundEnum.columns[enumColumnName] = {
              schemaName: refDbMetaCurrentTable.schemaName,
              tableName: refDbMetaCurrentTable.name,
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
  NonNullType: (gQlNonNullTypeNode: NonNullTypeNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn): void => {
    // add new constraint
    const constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_not_null`;
    createConstraint(constraintName, "NOT NULL", {}, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);

    // parse sub type
    if (gQlNonNullTypeNode.type != null) {
      const gQlSchemaTypeNode = gQlNonNullTypeNode.type;
      parseASTNode(gQlSchemaTypeNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    }
  },

  // set list type
  ListType: (gQlListTypeNode: ListTypeNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn): void => {
    dbMetaNode.type = "jsonb";
    dbMetaNode.defaultValue = {};
  },

  // parse Argument
  Argument: (gQlArgumentNode: ArgumentNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn): void => {
    // set argument name and value
    if (gQlArgumentNode != null && dbMetaNode != null) {
      dbMetaNode[gQlArgumentNode.name.value] = (gQlArgumentNode.value as { value: string }).value;
    }
  }
};

// iterate dbMeta and change virtual relational column names to actual column names
function changeVirtualColumnNamesToActualColumnNamesForRelations(dbMeta: IDbMeta) {
  Object.values(dbMeta.relations).forEach((relation) => {
    Object.values(relation).forEach((relationSide: IDbRelation) => {
      renameColumn(dbMeta, relationSide.schemaName, relationSide.tableName, relationSide.virtualColumnName, relationSide.columnName);
      // drop many:one side virtual column
      if (relationSide.columnName == null) {
        deleteColumn(dbMeta, relationSide.schemaName, relationSide.tableName, relationSide.virtualColumnName);
      } else {
        // change column type to uuid
        const columnType = relationSide.type === "ONE" ? "uuid" : "uuid[]";
        changeColumnType(dbMeta, relationSide.schemaName, relationSide.tableName, relationSide.columnName, columnType);
      }
    });
  });
}

function renameColumn(dbMeta: IDbMeta, schemaName: string, tableName: string, oldColumnName: string, newColumnName?: string) {
  if (newColumnName != null) {
    // find column
    const thisTable = dbMeta.schemas[schemaName].tables[tableName];
    const column = thisTable.columns[oldColumnName];
    if (column != null) {
      // change name
      column.name = newColumnName;
      // change column key
      thisTable.columns[newColumnName] = column;
      delete thisTable.columns[oldColumnName];

      // constraints available?
      if (column.constraintNames != null) {
        // iterate constraints and rename based on new name
        const newConstraintNames = [];
        Object.entries(column.constraintNames).forEach((constraintName) => {
          const oldConstraintName = constraintName[1];
          const newConstraintName = oldConstraintName.replace(oldColumnName, newColumnName);
          // add new name to new list
          newConstraintNames.push(newConstraintName);
          const constraint = thisTable.constraints[oldConstraintName];
          // delete old constraint first and create new one afterwards (in case the name didn't change)
          delete thisTable.constraints[oldConstraintName];
          thisTable.constraints[newConstraintName] = constraint;

          // replace column name in constraint
          const columnNameInConstraintIndex = constraint.columns.indexOf(oldColumnName);
          constraint.columns[columnNameInConstraintIndex] = newColumnName;
        });
        // replace old constraints list with new one
        column.constraintNames = newConstraintNames;
      }
    }
  }
}

function changeColumnType(dbMeta: IDbMeta, schemaName: string, tableName: string, columnName: string, columnType) {
  if (columnName != null) {
    dbMeta.schemas[schemaName].tables[tableName].columns[columnName].type = columnType;
  }
}

function deleteColumn(dbMeta: IDbMeta, schemaName: string, tableName: string, columnNameToDrop: string) {
  const thisTable = dbMeta.schemas[schemaName].tables[tableName];
  // column available?
  if (thisTable.columns[columnNameToDrop]) {
    // constraints available?
    if (thisTable.columns[columnNameToDrop].constraintNames != null) {
      // delete constraints
      Object.values(thisTable.columns[columnNameToDrop].constraintNames).forEach((constraintName) => {
        delete thisTable.constraints[constraintName];
      });
    }

    // delete column
    delete thisTable.columns[columnNameToDrop];
  }
}
