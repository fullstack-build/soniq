"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(view) {
    let viewName = view.gqlTypeName + '_' + view.name;
    if (view.type === 'CREATE' || view.type === 'UPDATE') {
        viewName = view.type.toLocaleLowerCase() + '_' + viewName;
    }
    if (view.type === 'DELETE') {
        viewName = view.type.toLocaleLowerCase() + '_' + view.gqlTypeName;
    }
    return viewName.toUpperCase();
}
exports.default = default_1;
