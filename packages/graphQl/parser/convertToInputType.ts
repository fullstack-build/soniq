export default (type, document) => {
  // console.log('>>>>>', JSON.stringify(type, null, 2));
  const definitions = [];

  type.kind = 'InputObjectTypeDefinition';

  Object.values(type.fields).forEach((field) => {
      let namedType = null;
      if (field.type.kind === 'NamedType') {
        namedType = filed.type.type.name.;
      }
  });

  return definitions;
};
