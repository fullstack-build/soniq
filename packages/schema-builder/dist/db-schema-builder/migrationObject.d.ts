import { IDbMeta } from "./IDbMeta";
export declare class MigrationObject {
    readonly ACTION_KEY: string;
    readonly fromDbMeta: IDbMeta;
    readonly toDbMeta: IDbMeta;
    readonly migrationObj: IDbMeta;
    constructor(fromDbMeta: IDbMeta, toDbMeta: IDbMeta);
    private splitActionFromNode;
    private diffAndAddActions;
    private adjustDeltaDbMeta;
}
