
function getTypenamesFieldSql(value) {
  return 'ARRAY[\'Test\'] as demo';
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

export default (name, values) => {

  return getEnumDefinition(name, values);
};
