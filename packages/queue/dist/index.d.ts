import * as PgBoss from 'pg-boss';
export { PgBoss };
export declare class QueueFactory {
    private queue;
    private logger;
    private generalPool;
    constructor(loggerFactory?: any, generalPool?: any, config?: any);
    getQueue(): Promise<PgBoss>;
    private start();
}
