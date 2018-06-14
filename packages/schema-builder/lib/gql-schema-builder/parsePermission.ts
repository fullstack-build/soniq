
import { parseDirectives } from './utils/parseDirectives';
import { buildReadQuery } from './readViewBuilder';
import { buildUpdateView } from './updateViewBuilder';
import { buildCreateView } from './createViewBuilder';
import { buildDeleteView } from './deleteViewBuilder';

export function parsePermission(permission, context, extensions, config) {
  const { gqlDocument } = context;
  const sql = [];
  const meta = {
    query: {},
    mutation: {},
    permissionMeta: {}
  };

  let definitionIndex = null;
  let directives = null;
  gqlDocument.definitions.some((definition, key) => {
    if (definition.kind === 'ObjectTypeDefinition' && definition.name.value === permission.gqlTypeName) {
      directives = parseDirectives(definition.directives);
      if (directives.table != null) {
        definitionIndex = key;
        return true;
      }
    }
    return false;
  });

  if (definitionIndex == null) {
    throw new Error(`Could not find gqlTypeName '${permission.gqlTypeName}' for permission.`);
  }

  const gqlTypeDefinition = gqlDocument.definitions.splice(definitionIndex, 1)[0];

  const table = {
    gqlTypeName: permission.gqlTypeName,
    schemaName: directives.table.tableName || 'public',
    tableName: directives.table.tableName || permission.gqlTypeName,
    gqlTypeDefinition
  };

  meta.permissionMeta[permission.gqlTypeName] = permission.meta || null;

  if (permission.readExpressions != null && Object.keys(permission.readExpressions).length > 0) {
    const readQuery = buildReadQuery(table, permission.readExpressions, context, extensions, config);

    meta.query[permission.gqlTypeName] = readQuery.meta;
    readQuery.sql.forEach(q => sql.push(q));
    readQuery.gqlDefinitions.forEach(d => gqlDocument.definitions.push(d));
  }

  if (permission.deleteExpressions != null) {
    const deleteView = buildDeleteView(table, permission.deleteExpressions, context, extensions, config);
    meta.mutation[deleteView.meta.name] = deleteView.meta;
    deleteView.sql.forEach(q => sql.push(q));
    deleteView.gqlDefinitions.forEach(d => gqlDocument.definitions.push(d));
  }

  if (permission.updateViews != null) {
    Object.keys(permission.updateViews).forEach((name) => {
      const view = permission.updateViews[name];
      view.name = permission.updateViews[name].name || name;
      const updateView = buildUpdateView(table, view, context, extensions, config);
      meta.mutation[updateView.meta.name] = updateView.meta;
      updateView.sql.forEach(q => sql.push(q));
      updateView.gqlDefinitions.forEach(d => gqlDocument.definitions.push(d));
    });
  }

  if (permission.createViews != null) {
    Object.keys(permission.createViews).forEach((name) => {
      const view = permission.createViews[name];
      view.name = permission.createViews[name].name || name;
      const createView = buildCreateView(table, view, context, extensions, config);
      meta.mutation[createView.meta.name] = createView.meta;
      createView.sql.forEach(q => sql.push(q));
      createView.gqlDefinitions.forEach(d => gqlDocument.definitions.push(d));
    });
  }

  return {
    gqlDocument,
    meta,
    sql
  };
}
