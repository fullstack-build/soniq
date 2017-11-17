// refDbObjectActualTable: ref to current parent table obj will be passed through all iterations
export const parseGraphQlJsonNode = (gQlSchemaNode,
                                     dbObjectNode,
                                     dbObject?,
                                     refDbObjectActualTable?) => {

  // ref to dbObject will be passed through all iterations
  const refDbObj = dbObject || dbObjectNode;

  // dynamic parser loader
  if (gQlSchemaNode == null || gQlSchemaNode.kind == null) {
    // ignore empty nodes or nodes without a kind
  } else if (graphQlJsonSchemaParser[gQlSchemaNode.kind] == null) {
    process.stdout.write('parser.error.unknown.type: ' + gQlSchemaNode.kind);
  } else { // parse
    graphQlJsonSchemaParser[gQlSchemaNode.kind](gQlSchemaNode,
                                                dbObjectNode,
                                                refDbObj,
                                                refDbObjectActualTable);
  }

};

const graphQlJsonSchemaParser = {
  // iterate over all type definitions
  Document: (gQlSchemaNode, dbObjectNode, refDbObj) => {
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      parseGraphQlJsonNode(gQlJsonSchemaDocumentNode, dbObjectNode, refDbObj);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (gQlSchemaDocumentNode, dbObjectNode, refDbObj) => {
    const typeName = gQlSchemaDocumentNode.name.value;
    // create tableObject in tableObjects
    // and save ref to it for recursion
    const refDbObjectActualTable = dbObjectNode[typeName] = {
      isDbModel: false,
      schemaName: 'public',
      tableName: typeName,
    };
    // parse ObjectType properties
    Object.values(gQlSchemaDocumentNode).map((gQlSchemaDocumentNodeProperty) => {
      // iterate over sub nodes (e.g. intefaces, fields, directives
      if (Array.isArray(gQlSchemaDocumentNodeProperty)) {
        Object.values(gQlSchemaDocumentNodeProperty).map((gQlSchemaDocumentSubnode) => {
          // parse sub node
          parseGraphQlJsonNode(gQlSchemaDocumentSubnode,
                               dbObjectNode[typeName],
                               refDbObj,
                               refDbObjectActualTable);
        });
      }
    });
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (gQlFieldDefinitionNode, dbObjectNode, refDbObj, refDbObjectActualTable) => {
    // create fields object if not set already
    dbObjectNode.fields = dbObjectNode.fields || [];

    const newField = {
      constraints: {
        isPrimaryKey: false,
        nullable: true,
        unique: false,
      },
    };
    // add new field ref to dbObject
    // newField will now update data in the dbObject through this ref
    dbObjectNode.fields.push(newField);

    // parse FieldDefinition properties
    Object.values(gQlFieldDefinitionNode).map((gQlSchemaFieldNodeProperty) => {
      if (typeof gQlSchemaFieldNodeProperty !== 'string' &&
          !Array.isArray(gQlSchemaFieldNodeProperty)) {

        // parse sub node
        parseGraphQlJsonNode(gQlSchemaFieldNodeProperty,
                             newField,
                             refDbObj,
                             refDbObjectActualTable);

      } else if (typeof gQlSchemaFieldNodeProperty !== 'string' &&
                 !!Array.isArray(gQlSchemaFieldNodeProperty)) {

        // iterate over sub nodes (e.g. arguments, directives
        Object.values(gQlSchemaFieldNodeProperty).map((gQlSchemaFieldSubnode) => {
          // parse sub node
          parseGraphQlJsonNode(gQlSchemaFieldSubnode, newField, refDbObj, refDbObjectActualTable);
        });
      }
    });
  },
  // parse Name kind
  Name: (gQlSchemaNode, dbObjectNode, refDbObj, refDbObjectActualTable) => {
    // set field name
    dbObjectNode.name = gQlSchemaNode.value;
  },
  // parse NamedType kind
  NamedType: (gQlSchemaNode, dbObjectNode, refDbObj, refDbObjectActualTable) => {
    const fieldType = gQlSchemaNode.name.value;
    let dbType = 'varchar';
    switch (fieldType) {
      case 'ID':
        dbType = 'uuid';
        dbObjectNode.constraints.isPrimaryKey = true;
        break;
      case 'String':
        dbType = 'varchar';
        break;
      default:
        // probably relation name
        process.stdout.write('parser.error.unknown.field.type: ' +  fieldType +  '\n');
        break;
    }

    // set field name
    dbObjectNode.type = dbType;
  },
  // parse NonNullType kind
  NonNullType: (gQlSchemaNode, dbObjectNode, refDbObj, refDbObjectActualTable) => {

    // set NOT NULL restriction
    dbObjectNode.constraints.nullable = false;

    // parse sub type
    if (gQlSchemaNode.type != null) {
      const gQlSchemaTypeNode = gQlSchemaNode.type;
      parseGraphQlJsonNode(gQlSchemaTypeNode, dbObjectNode, refDbObj, refDbObjectActualTable);
    }
  },
  // set list type
  ListType: (gQlSchemaTypeNode, dbObjectNode, refDbObj, refDbObjectActualTable) => {
    dbObjectNode.type = 'jsonb';
    dbObjectNode.defaultValue = [];
  },
  // parse Directive
  Directive: (gQlDirectiveNode, dbObjectNode, refDbObj, refDbObjectActualTable) => {

    const directiveKind = gQlDirectiveNode.name.value;
    switch (directiveKind) {
      case 'model':
        dbObjectNode.isDbModel = true;
        break;
      case 'isUnique':
        dbObjectNode.constraints.unique = true;
        break;
      case 'computed':
        dbObjectNode.type = 'computed';
        break;
      case 'relation':
        dbObjectNode.type = 'relation';
        break;
      default:
        process.stdout.write('parser.error.unknown.directive.kind: ' +  directiveKind);
        break;
    }
  },
};
