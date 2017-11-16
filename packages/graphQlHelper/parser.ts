export const parseGraphQlJsonNode = (tableObjects, node) => {

  // dynamic parser loader
  if (node == null || node.kind == null) {
    // ignore empty nodes or nodes without a kind
  } else if (graphQlJsonSchemaParser[node.kind] == null) {
    process.stdout.write('parser.error.unknown.type: ' + node.kind);
  } else { // parse
    graphQlJsonSchemaParser[node.kind](tableObjects, node);
  }

};

const graphQlJsonSchemaParser = {
  // iterate over all type definitions
  Document: (tableObjects, node) => {
    Object.values(node.definitions).map((element) => {
      parseGraphQlJsonNode(tableObjects, element);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (tableObjects, node) => {
    const typeName = node.name.value;
    // create tableObject in tableObjects
    tableObjects[typeName] = {
      isDbModel: false,
      tableName: typeName,
    };
    // parse ObjectType properties
    Object.values(node).map((element) => {
      // iterate over sub nodes (e.g. intefaces, fields, directives
      if (Array.isArray(element)) {
        Object.values(element).map((subnode) => {
          // parse sub node
          parseGraphQlJsonNode(tableObjects[typeName], subnode);
        });
      }
    });
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (tableObject, node) => {
    // create fields object if not set already
    tableObject.fields = tableObject.fields || [];

    const newField = {
      constraints: {
        isPrimaryKey: false,
        nullable: true,
        unique: false,
      },
    };
    tableObject.fields.push(newField);

    /*
    // create field object if not set already
    const tableObjectField = tableObject.fields[fieldName] = tableObject.fields[fieldName] || {};
    // set name
    tableObject.fields[fieldName].name = fieldName;
    */

    // parse FieldDefinition properties
    Object.values(node).map((element) => {
      if (typeof element !== 'string' && !Array.isArray(element)) {

        // parse sub node
        parseGraphQlJsonNode(newField, element);

      } else if (typeof element !== 'string' && !!Array.isArray(element)) {

        // iterate over sub nodes (e.g. arguments, directives
        Object.values(element).map((subnode) => {
          // parse sub node
          parseGraphQlJsonNode(newField, subnode);
        });

      }
    });
  },
  // parse Name kind
  Name: (fieldObject, node) => {
    // set field name
    fieldObject.name = node.value;
  },
  // parse NamedType kind
  NamedType: (fieldObject, node) => {
    const fieldType = node.name.value;
    let dbType = 'varchar';
    switch (fieldType) {
      case 'ID':
        dbType = 'uuid';
        fieldObject.constraints.isPrimaryKey = true;
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
    fieldObject.type = dbType;
  },

  // parse NonNullType kind
  NonNullType: (fieldObject, node) => {

    // set NOT NULL restriction
    fieldObject.constraints.nullable = false;

    // parse sub type
    if (node.type != null) {
      parseGraphQlJsonNode(fieldObject, node.type);
    }
  },
  // set list type
  ListType: (fieldObject, node) => {
    fieldObject.type = 'jsonb';
    fieldObject.defaultValue = [];
  },
  // parse Directive
  Directive: (tableObject, node) => {

    const directiveKind = node.name.value;
    switch (directiveKind) {
      case 'model':
        tableObject.isDbModel = true;
        break;
      case 'isUnique':
        tableObject.constraints.unique = true;
        break;
      case 'computed':
        tableObject.type = 'computed';
        break;
      case 'relation':
        tableObject.type = 'relation';
        break;
      default:
        process.stdout.write('parser.error.unknown.directive.kind: ' +  directiveKind);
        break;
    }
  },
};
