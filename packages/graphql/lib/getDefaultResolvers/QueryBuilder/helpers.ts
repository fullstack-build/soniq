import { IReadViewMeta } from "@fullstack-one/schema-builder";

export function getFieldExpression(name: string, localViewName: string): string {
  return `"${localViewName}"."${name}"`;
}

export function getFromExpression(gqlTypeMeta: IReadViewMeta, localViewName: string, authRequired: boolean): string {
  const viewName = authRequired === true ? gqlTypeMeta.authViewName : gqlTypeMeta.publicViewName;
  return `"${gqlTypeMeta.viewSchemaName}"."${viewName}" AS "${localViewName}"`;
}

export function getLocalName(counter: number): string {
  return `_local_${counter}_`;
}
