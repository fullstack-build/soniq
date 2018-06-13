
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

export function getOperatorsDefinition(operatorsObject) {
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
