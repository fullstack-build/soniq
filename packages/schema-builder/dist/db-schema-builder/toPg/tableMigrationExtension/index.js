"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tableMigrationExtensions = {};
function registerTableMigrationExtension(extensionNameInLowerCase, fn) {
    tableMigrationExtensions[extensionNameInLowerCase] = fn;
}
exports.registerTableMigrationExtension = registerTableMigrationExtension;
function getTableMigrationExtension(extensionName) {
    return (extensionName != null) ? tableMigrationExtensions[extensionName] : tableMigrationExtensions;
}
exports.getTableMigrationExtension = getTableMigrationExtension;
