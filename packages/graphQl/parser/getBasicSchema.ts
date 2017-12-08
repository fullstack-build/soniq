
import getQueryArguments from './getQueryArguments';

function getQuery(name, type, typesEnumName) {
  return {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    arguments: getQueryArguments(typesEnumName),
    type: {
      kind: 'NonNullType',
      type: {
        kind: 'ListType',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: type,
            },
          },
        },
      },
    },
    directives: [],
  };
}

export default (queries) => {

  const queryFields = [];
  Object.values(queries).forEach((query) => {
    queryFields.push(getQuery(query.name, query.type, query.typesEnumName));
  });

  const definitions = [
    {
      kind: 'SchemaDefinition',
      directives: [],
      operationTypes: [
        {
          kind: 'OperationTypeDefinition',
          operation: 'query',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'RootQuery',
            },
          },
        },
      ],
    }, {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: 'RootQuery',
      },
      interfaces: [],
      directives: [],
      fields: queryFields,
    },
  ];

  return definitions;
};
