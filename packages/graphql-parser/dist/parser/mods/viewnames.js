"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseView(ctx) {
    const viewName = ctx.view.viewName;
    if (ctx.view.type === 'READ') {
        ctx.dbView.fields.push({
            name: '_viewnames',
            expression: `ARRAY['${viewName}'] AS _viewnames`
        });
    }
}
exports.parseView = parseView;
