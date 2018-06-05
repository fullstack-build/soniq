import { IDbMeta } from '../IDbMeta';
export { registerTableMigrationExtension } from './tableMigrationExtension';
export { registerColumnMigrationExtension } from './columnMigrationExtension';
export declare namespace sqlObjFromMigrationObject {
    function getSqlFromMigrationObj(pMigrationObj: IDbMeta, pToDbMeta: IDbMeta, pRenameInsteadOfDrop?: boolean): string[];
}
