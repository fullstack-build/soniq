
function getEnumValue(value) {
  return {
        kind: 'EnumValueDefinition',
        name: {
          kind: 'Name',
          value
        },
        directives: []
      };
}

function getEnumDefinition(name, values) {
  return {
    kind: 'EnumTypeDefinition',
    name: {
      kind: 'Name',
      value: name
    },
    directives: [],
    values: values.map(getEnumValue)
  };
}

export function getEnum(name, values) {

  return getEnumDefinition(name, values);
}
