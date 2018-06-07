import { utils } from '@fullstack-one/schema-builder';

const { findDirectiveIndex } = utils;

function getAuthTokenArgument() {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'authToken'
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'String'
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getPrivacyTokenArgument() {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'privacyToken'
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'String'
      }
    },
    defaultValue: null,
    directives: []
  };
}

function getMetaArgument() {
  return {
    kind: 'InputValueDefinition',
    name: {
      kind: 'Name',
      value: 'meta'
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'String'
      }
    },
    defaultValue: null,
    directives: []
  };
}

export function getParser(setParserMeta) {
  const parser: any = {};

  parser.parseField = (field, ctx) => {
    const fieldName = field.name.value;
    const isIncluded = ctx.view.fields.indexOf(fieldName) >= 0;

    if (!isIncluded) {
      return false;
    }
    const acceptedVersionDirectiveIndex = findDirectiveIndex(field, 'privacyPolicyAcceptedVersion');
    const acceptedAtDirectiveIndex = findDirectiveIndex(field, 'privacyPolicyAcceptedAtInUTC');

    if (acceptedVersionDirectiveIndex >= 0) {
      setParserMeta('privacyPolicyAcceptedVersion', fieldName);
    }
    if (acceptedAtDirectiveIndex >= 0) {
      setParserMeta('privacyPolicyAcceptedAtInUTC', fieldName);
    }
    return false;
  };

  parser.parseView = (ctx) => {
    const viewName = ctx.view.viewName;
    const gqlTypeName = ctx.view.gqlTypeName;
    const viewSchemaName = ctx.viewSchemaName;
    const view = ctx.view;
    // Add view to GraphQl graphQlDocument

    const authDirectiveIndex = findDirectiveIndex(ctx.tableView, 'auth');

    if (view.type === 'CREATE' && authDirectiveIndex >= 0) {
      ctx.tableView.kind = 'InputObjectTypeDefinition';

      if (ctx.view.mutationIndex == null) {
        ctx.graphQlDocument.definitions.push(ctx.tableView);
      }

      const mutation = {
        name: viewName.toString(),
        type: view.type,
        inputType: viewName,
        returnType: 'ID',
        viewsEnumName: null,
        viewName,
        viewSchemaName,
        gqlTypeName,
        tableName: view.tableName,
        extendArguments: [
          getAuthTokenArgument(),
          getPrivacyTokenArgument(),
          getMetaArgument()
        ]
      };

      if (ctx.view.mutationIndex == null) {
        ctx.view.mutationIndex = ctx.mutations.push(mutation);
      } else {
        ctx.mutations[ctx.view.mutationIndex] = mutation;
      }
    }
  };

  return parser;
}
