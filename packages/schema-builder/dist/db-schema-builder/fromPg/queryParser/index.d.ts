import { IDbMeta } from '../../IDbMeta';
import { DbAppClient } from '@fullstack-one/db';
export declare function registerQueryParser(callback: (dbClient: DbAppClient, dbMeta: IDbMeta) => void): void;
export declare function getQueryParser(): any;
