"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getViewnamesField_1 = require("../utils/getViewnamesField");
function parseView(ctx) {
    const viewName = ctx.view.viewName;
    const gqlTypeName = ctx.view.gqlTypeName;
    // Only required for READ Views
    if (ctx.view.type === 'READ') {
        // Add field to db-native view with it's expression
        ctx.dbView.fields.push({
            name: '_viewnames',
            expression: `ARRAY['${viewName}'] AS _viewnames`
        });
        const viewsEnumName = (gqlTypeName + '_VIEWS').toUpperCase();
        // Add _viewnames field to type
        ctx.tableView.fields.push(getViewnamesField_1.default(viewsEnumName));
    }
}
exports.parseView = parseView;
