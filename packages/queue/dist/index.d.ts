import * as PgBoss from 'pg-boss';
export { PgBoss };
import * as ONE from 'fullstack-one';
export declare class QueueFactory extends ONE.AbstractPackage {
    private queue;
    private logger;
    private generalPool;
    constructor(loggerFactory?: any);
    getQueue(): Promise<PgBoss>;
    private start();
}
