import { buildReadView } from "./createView";
import { createQuery } from "./createQuery";
import { getFilterDefinitions } from "./getFilterDefinitions";

export function buildReadQuery(table, readExpressions, context, extensions, config) {
  const gqlDefinitions = [];
  const sql = [];
  const queryName = `${table.gqlTypeName.toLowerCase()}s`;
  const orderByEnumName = `${table.gqlTypeName}OrderBy`;
  const whereFilterName = `${table.gqlTypeName}Filter`;
  let viewCreated = false;

  const { meta, authViewSql, publicViewSql, gqlDefinition } = buildReadView(table, readExpressions, context, extensions, config);

  if (authViewSql != null) {
    authViewSql.forEach((q) => sql.push(q));
    viewCreated = true;
  }
  if (publicViewSql != null) {
    publicViewSql.forEach((q) => sql.push(q));
    viewCreated = true;
  }

  if (viewCreated === true && gqlDefinition != null) {
    gqlDefinitions.push(gqlDefinition);
    gqlDefinitions.push(createQuery(queryName, table.gqlTypeName));
  }

  const nativeFieldNames = Object.values(meta.fields)
    .filter((field: any) => field.nativeFieldName != null && field.isVirtual !== true)
    .map((field: any) => field.nativeFieldName);

  getFilterDefinitions(nativeFieldNames, orderByEnumName, whereFilterName).forEach((d) => gqlDefinitions.push(d));

  return {
    gqlDefinitions,
    meta,
    sql
  };
}
