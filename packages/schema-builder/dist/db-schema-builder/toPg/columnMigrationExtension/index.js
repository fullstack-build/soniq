"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const columnMigrationExtensions = {};
function registerColumnMigrationExtension(extensionNameInLowerCase, fn) {
    columnMigrationExtensions[extensionNameInLowerCase] = fn;
}
exports.registerColumnMigrationExtension = registerColumnMigrationExtension;
function getColumnMigrationExtension(extensionName) {
    return (extensionName != null) ? columnMigrationExtensions[extensionName] : columnMigrationExtensions;
}
exports.getColumnMigrationExtension = getColumnMigrationExtension;
