function getUnionType(name) {
  return {
    kind: 'NamedType',
    name: {
      kind: 'Name',
      value: name,
    },
  };
}

export default (name, views) => {
  const definition = {
    kind: 'UnionTypeDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    directives: [],
    types: [],
  };
  Object.values(views).forEach((view) => {
    definition.types.push(getUnionType(view));
  });

  return definition;
};
