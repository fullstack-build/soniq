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

export function getFilterDefinitions(fieldNames, orderByEnumName, whereFilterName) {
  return [getOrderByEnum(orderByEnumName, fieldNames), getWhereType(whereFilterName, fieldNames)];
}
