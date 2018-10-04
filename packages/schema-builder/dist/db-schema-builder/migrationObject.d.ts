import { IDbMeta } from "./IDbMeta";
export declare class MigrationObject {
  private readonly ACTION_KEY;
  private fromDbMeta;
  private toDbMeta;
  private migrationObj;
  private splitActionFromNode;
  private diffAndAddActions;
  private adjustDeltaDbMeta;
  createFromTwoDbMetaObjects(pFromDbMeta: IDbMeta, pToDbMeta: IDbMeta): IDbMeta;
}
