
import { parsePermission } from './parsePermission';
import { extensions as defaultExtensions } from './extensions';
import { createSchemaBasics } from './createSchemaBasics';
import { createMutation } from './createMutation';

export function parsePermissions(permissions, context, extensions, config) {
  const meta = {
    query: {},
    mutation: {},
    permissionMeta: {}
  };

  createSchemaBasics().forEach(d => context.gqlDocument.definitions.push(d));

  const sql = [];

  const currentExtensions = extensions.slice().concat(defaultExtensions.slice());

  permissions.forEach((permission) => {
    const result = parsePermission(permission, context, currentExtensions, config);
    meta.query = Object.assign(meta.query, result.meta.query);
    meta.mutation = Object.assign(meta.mutation, result.meta.mutation);
    meta.permissionMeta = Object.assign(meta.permissionMeta, result.meta.permissionMeta);

    result.sql.forEach(q => sql.push(q));

    context.gqlDocument = result.gqlDocument;
  });

  const modifiedMutation = {};

  Object.values(meta.mutation).forEach((mutation: any) => {
    const extendArguments = [];
    let myMutation = mutation;
    currentExtensions.forEach((parser: any) => {
      if (parser.modifyMutation != null) {
        const result = parser.modifyMutation(myMutation);
        if (result != null) {
          if (result.extendArguments != null && Array.isArray(result.extendArguments)) {
            result.extendArguments.forEach((argument) => {
              extendArguments.push(argument);
            });
          }
          if (result.mutation) {
            myMutation = result.mutation;
          }
        }
      }
    });
    const gqlMutation = createMutation(myMutation.name, myMutation.gqlReturnTypeName, myMutation.gqlInputTypeName, extendArguments);
    context.gqlDocument.definitions.push(gqlMutation);
    modifiedMutation[myMutation.name] = mutation;
  });

  meta.mutation = modifiedMutation;

  currentExtensions.forEach((parser: any) => {
    if (parser.extendDefinitions != null) {
      const definitions = parser.extendDefinitions(context.gqlDocument, meta, sql);
      if (definitions != null && Array.isArray(definitions)) {
        definitions.forEach((definition) => {
          context.gqlDocument.definitions.push(definition);
        });
      }
    }
  });

  return {
    gqlDocument: JSON.parse(JSON.stringify(context.gqlDocument)),
    meta,
    sql
  };
}
