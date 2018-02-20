import { IDbMeta } from 'fullstack-one';
export declare namespace graphQl.helper {
    const parseGraphQlSchema: (graphQlSchema: any) => any;
    const printGraphQlDocument: (gQlDocument: any) => string;
    const writeTableObjectIntoMigrationsFolder: (migrationsPath: string, tableObject: IDbMeta, migrationId?: number) => Promise<void>;
}
