import * as PgBoss from 'pg-boss';
export { PgBoss };
import { Config } from '@fullstack-one/config';
export declare class QueueFactory {
    private queue;
    private logger;
    private generalPool;
    constructor(loggerFactory?: any, generalPool?: any, config?: Config);
    getQueue(): Promise<PgBoss>;
    private start();
}
