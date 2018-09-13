import * as PgBoss from 'pg-boss';
export { PgBoss };
import { Config } from '@fullstack-one/config';
export declare class QueueFactory {
    private queue;
    private loggerFactory;
    private logger;
    private generalPool;
    constructor(bootLoader: any, loggerFactory: any, generalPool: any, config: Config);
    private boot;
    getQueue(): Promise<PgBoss>;
    private start;
}
