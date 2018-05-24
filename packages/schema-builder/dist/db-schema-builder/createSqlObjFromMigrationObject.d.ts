import { IDbMeta } from './pg/IDbMeta';
export declare namespace sqlObjFromMigrationObject {
    function getSqlFromMigrationObj(pMigrationObj: IDbMeta, pToDbMeta: IDbMeta, pRenameInsteadOfDrop?: boolean): string[];
}
