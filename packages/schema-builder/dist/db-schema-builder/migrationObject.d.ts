import { IDbMeta } from './pg/IDbMeta';
export declare namespace migrationObject {
    function createFromTwoDbMetaObjects(pFromDbMeta: IDbMeta, pToDbMeta: IDbMeta): IDbMeta;
}
