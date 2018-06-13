export function parseView(ctx) {
  const viewName = ctx.view.viewName;
  const gqlTypeName = ctx.view.gqlTypeName;
  const viewSchemaName = ctx.viewSchemaName;
  const view = ctx.view;
  // Add view to GraphQl graphQlDocument
  if (ctx.view.mutationIndex == null && (view.type === 'CREATE' || view.type === 'UPDATE' || view.type === 'DELETE')) {

    ctx.tableView.kind = 'InputObjectTypeDefinition';

    ctx.graphQlDocument.definitions.push(ctx.tableView);

    let returnType = gqlTypeName;

    if (view.type === 'DELETE') {
      returnType = 'ID';
    }

    ctx.view.mutationIndex = ctx.mutations.push({
      name: viewName.toString(),
      type: view.type,
      inputType: viewName,
      returnType,
      viewsEnumName: (gqlTypeName + '_VIEWS').toUpperCase(),
      viewName,
      viewSchemaName,
      gqlTypeName,
      tableName: view.tableName
    });
  }
}
