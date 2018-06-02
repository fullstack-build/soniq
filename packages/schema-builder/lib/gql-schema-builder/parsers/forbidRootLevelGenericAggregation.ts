export function parseView(ctx) {
  const viewName = ctx.view.viewName;
  const gqlTypeName = ctx.view.gqlTypeName;
  const view = ctx.view;

  // Add view to GraphQl graphQlDocument
  if (view.type === 'READ' && view.forbidRootLevelGenericAggregation === true) {
    ctx.gQlTypes[gqlTypeName].noRootLevelAggViewNames.push(viewName);
  }
}
