import { utils } from '@fullstack-one/schema-builder';

const { findDirectiveIndex } = utils;

function getLimitArgument() {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'limit'
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'Int'
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getOffsetArgument() {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'offset'
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'Int'
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getWhereArgument(whereArgumentValue) {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'where'
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: whereArgumentValue
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getOrderByArgument(orderByArgumentValue) {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'orderBy'
    },
    type: {
      kind: 'ListType',
      type: {
        kind: 'NonNullType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: orderByArgumentValue,
          }
        }
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getFieldArgument(fieldName) {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: fieldName
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'Operators'
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getWhereType(name, fieldNames) {
  const def: any = {
    kind: 'InputObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: name
    },
    directives: [],
    fields: [{
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: 'OR'
        },
        type: {
          kind: 'ListType',
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: name,
              }
            }
          }
        },
        defaultValue: null,
        directives: []
      },
      {
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: 'AND'
        },
        type: {
          kind: 'ListType',
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: name,
              }
            }
          }
        },
        defaultValue: null,
        directives: []
      }
    ]
  };

  fieldNames.forEach((fieldName) => {
    def.fields.push(getFieldArgument(fieldName));
  });

  def.fields.push(getFieldArgument('_viewnames'));

  return def;
}

function getEnumValueDefinition(option) {
  return {
    kind: 'EnumValueDefinition',
    name: {
      kind: 'Name',
      value: option
    },
    directives: []
  };
}

function getOrderByEnum(name, fields) {
  const options = [];
  fields.forEach((fieldName) => {
    options.push(`${fieldName}_ASC`);
    options.push(`${fieldName}_DESC`);
  });
  return {
    kind: 'EnumTypeDefinition',
    name: {
      kind: 'Name',
      value: name
    },
    directives: [],
    values: options.map(getEnumValueDefinition)
  };
}

function operationValueMapper(value) {
  if (value[0] !== '[') {
    return {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value
      }
    };
  } else {
    return {
      kind: 'ListType',
      type: {
        kind: 'NonNullType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'String',
          },
        },
      },
    };
  }
}

function getOperationField(operation) {
  const def = {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: operation.name
    },
    type: operationValueMapper(operation.value),
    defaultValue: null,
    directives: []
  };

  return def;
}

function getOperationType(operatorsObject) {
  return {
    kind: 'InputObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: 'Operators'
    },
    directives: [],
    fields: Object.values(operatorsObject).map(getOperationField)
  };
}

export function getParser(operatorsObject) {
  const parser: any = {};
  const schemaExtensions: any = {};

  parser.extendQueryArguments = () => {
    return (typesEnumName, name) => {
      const whereArgumentValue = `${name}Filter`;
      const orderByArgumentValue = `${name}OrderBy`;
      schemaExtensions[name] = { name, whereArgumentValue, orderByArgumentValue };
      return [getWhereArgument(whereArgumentValue), getLimitArgument(), getOffsetArgument(), getOrderByArgument(orderByArgumentValue)];
    };
  };

  parser.return = (ctx) => {
    ctx.document.definitions.push(getOperationType(operatorsObject));
    Object.values(schemaExtensions).forEach(({ name, whereArgumentValue, orderByArgumentValue }) => {
      ctx.document.definitions.push(getWhereType(whereArgumentValue, ctx.gQlTypes[name].fieldNames));
      ctx.document.definitions.push(getOrderByEnum(orderByArgumentValue, ctx.gQlTypes[name].fieldNames));
    });
  };

  return parser;
}
