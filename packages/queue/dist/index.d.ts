import * as PgBoss from 'pg-boss';
export { PgBoss };
export declare class QueueFactory {
    private queue;
    private logger;
    private generalPool;
    constructor(loggerFactory?: any);
    getQueue(): Promise<PgBoss>;
    private start();
}
