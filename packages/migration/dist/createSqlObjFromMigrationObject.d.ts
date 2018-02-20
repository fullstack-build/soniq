import * as One from 'fullstack-one';
export declare namespace sqlObjFromMigrationObject {
    function getSqlFromMigrationObj(pMigrationObj: One.IDbMeta, pToDbMeta: One.IDbMeta, pRenameInsteadOfDrop?: boolean): string[];
}
