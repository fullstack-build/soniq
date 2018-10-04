import { IDbMeta } from "./db-schema-builder/IDbMeta";
export abstract class AGraphQlHelper {
  static parseGraphQlSchema(graphQlSchema: any): any;
  static printGraphQlDocument: (gQlDocument: any) => string;
  static writeTableObjectIntoMigrationsFolder(migrationsPath: string, tableObject: IDbMeta, migrationId?: number): Promise<void>;
}
