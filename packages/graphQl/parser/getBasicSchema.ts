import getQueryArguments from './getQueryArguments';
import getMutationArguments from './getMutationArguments';
import createSqlQueryInput from './createSqlQueryInput';

function getMutation(name, inputType, typesEnumName, returnType) {
  return {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    arguments: getMutationArguments(typesEnumName, inputType),
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: returnType,
      },
    },
    directives: [],
  };
}

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

export default (queries, mutations) => {

  const queryFields = [];
  Object.values(queries).forEach((query) => {
    queryFields.push(getQuery(query.name, query.type, query.typesEnumName));
  });

  const mutationFields = [];
  Object.values(mutations).forEach((mutation) => {
    mutationFields.push(getMutation(mutation.name, mutation.inputType, mutation.typesEnumName, mutation.returnType));
  });

  const definitions = [];

  definitions.push({
    kind: 'SchemaDefinition',
    directives: [],
    operationTypes: [{
        kind: 'OperationTypeDefinition',
        operation: 'query',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'Query',
          },
        },
      },
      {
        kind: 'OperationTypeDefinition',
        operation: 'mutation',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'Mutation',
          },
        },
      }
    ],
  });

  definitions.push({
    kind: 'ObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: 'Query',
    },
    interfaces: [],
    directives: [],
    fields: queryFields,
  });

  definitions.push({
    kind: 'ObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: 'Mutation',
    },
    interfaces: [],
    directives: [],
    fields: mutationFields,
  });

  definitions.push(createSqlQueryInput());

  return definitions;
};
