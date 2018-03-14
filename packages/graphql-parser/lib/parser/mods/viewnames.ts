
export function parseView(ctx) {
  const viewName = ctx.view.viewName;
  if (ctx.view.type === 'READ') {
    ctx.dbView.fields.push({
      name: '_viewnames',
      expression: `ARRAY['${viewName}'] AS _viewnames`
    });
  }
}
