import getMutationArguments from './getMutationArguments';
import createSqlQueryInput from './createSqlQueryInput';

function getMutation(name, inputType, viewsEnumName, returnType, extendArguments) {
  return {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    arguments: getMutationArguments(viewsEnumName, inputType, extendArguments),
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

function getQuery(name, type, viewsEnumName, getQueryArguments) {
  return {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    arguments: getQueryArguments(viewsEnumName, type),
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

export default (queries, mutations, getQueryArguments) => {

  const queryFields = [];
  Object.values(queries).forEach((query: any) => {
    queryFields.push(getQuery(query.name, query.type, query.viewsEnumName, getQueryArguments));
  });

  const mutationFields = [];
  Object.values(mutations).forEach((mutation: any) => {
    mutationFields.push(getMutation(mutation.name, mutation.inputType, mutation.viewsEnumName, mutation.returnType, mutation.extendArguments));
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
