import { parsePermission } from "./parsePermission";
import { extensions as defaultExtensions } from "./extensions";
import { createSchemaBasics } from "./createSchemaBasics";
import { createMutation } from "./createMutation";
import { IPermissionContext, IPermission, IConfig, IResolverMeta } from "./interfaces";
import { IParser } from "./extensions/interfaces";
import { DefinitionNode, DocumentNode } from "graphql";

export function parsePermissions(
  permissions: IPermission[],
  permissionContext: IPermissionContext,
  extensions: IParser[],
  config: IConfig
): { gqlDocument: DocumentNode; meta: IResolverMeta; sql: any[] } {
  const meta: IResolverMeta = {
    query: {},
    mutation: {},
    permissionMeta: {}
  };

  // TODO: Dustin: evaluate: permissionContext.gqlDocument = [...permissionContext.gqlDocument, ...createSchemaBasics()];
  createSchemaBasics().forEach((d) => (permissionContext.gqlDocument.definitions as DefinitionNode[]).push(d));

  const sql = [];
  // TODO: Dustin: same story... evaluate: permissionContext.gqlDocument = [...permissionContext.gqlDocument, ...createSchemaBasics()];
  const currentExtensions: IParser[] = extensions.slice().concat(defaultExtensions.slice());

  permissions.forEach((permission) => {
    const result = parsePermission(permission, permissionContext, currentExtensions, config);
    meta.query = { ...meta.query, ...result.meta.query };
    meta.mutation = { ...meta.mutation, ...result.meta.mutation };
    meta.permissionMeta = { ...meta.permissionMeta, ...result.meta.permissionMeta };

    result.sql.forEach((q) => sql.push(q));

    permissionContext.gqlDocument = result.gqlDocument;
  });

  const modifiedMutation = {};

  // Loop over mutations to modify them by extensions (e.g. add input arguments)
  Object.values(meta.mutation).forEach((mutation) => {
    const extendArguments = [];
    let myMutation = mutation;
    currentExtensions.forEach((parser) => {
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
    (permissionContext.gqlDocument.definitions as DefinitionNode[]).push(gqlMutation);
    modifiedMutation[myMutation.name] = mutation;
  });

  meta.mutation = modifiedMutation;

  // Loop over extensions to add definitions
  currentExtensions.forEach((parser) => {
    if (parser.extendDefinitions != null) {
      const definitions = parser.extendDefinitions(permissionContext.gqlDocument, meta, sql);
      if (definitions != null && Array.isArray(definitions)) {
        definitions.forEach((definition) => {
          (permissionContext.gqlDocument.definitions as DefinitionNode[]).push(definition);
        });
      }
    }
  });

  return {
    gqlDocument: JSON.parse(JSON.stringify(permissionContext.gqlDocument)),
    meta,
    sql
  };
}
