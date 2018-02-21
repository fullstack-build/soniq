import { IDbMeta } from '@fullstack-one/db';
export declare namespace sqlObjFromMigrationObject {
    function getSqlFromMigrationObj(pMigrationObj: IDbMeta, pToDbMeta: IDbMeta, pRenameInsteadOfDrop?: boolean): string[];
}
