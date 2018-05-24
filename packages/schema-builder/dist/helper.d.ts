import { IDbMeta } from './db-schema-builder/pg/IDbMeta';
export declare namespace graphQl.helper {
    const parseGraphQlSchema: any;
    const printGraphQlDocument: (gQlDocument: any) => string;
    const writeTableObjectIntoMigrationsFolder: (migrationsPath: string, tableObject: IDbMeta, migrationId?: number) => Promise<void>;
}
