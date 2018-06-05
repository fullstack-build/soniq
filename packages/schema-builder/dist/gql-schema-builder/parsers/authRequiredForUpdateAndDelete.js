"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseView(ctx) {
    const viewName = ctx.view.viewName;
    const view = ctx.view;
    // Add view to GraphQl graphQlDocument
    if (view.type === 'UPDATE' || view.type === 'DELETE') {
        Object.values(view.expressions).forEach((expression) => {
            if (expression.authRequired !== true) { //  && view.DANGEROUSLY_ALLOW_MUTATION_WIHTOUT_AUTH !== true
                if (view.type === 'UPDATE') {
                    throw new Error(`UPDATE-views are not allowed to contain a non-auth-expression. ` +
                        `Please have a look at view '${viewName}' in expression '${expression.name}'.`);
                }
                else {
                    throw new Error(`DELETE-views are not allowed to contain a non-auth-expression. ` +
                        `Please have a look at views [${view.originalNames.map(name => `'${name}'`).join(', ')}] in expression '${expression.name}'.`);
                }
            }
        });
    }
}
exports.parseView = parseView;
