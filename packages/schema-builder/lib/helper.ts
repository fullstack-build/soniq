import { parse, print } from "graphql";
import { writeFile } from "fs";
import { promisify } from "util";
const writeFileAsync = promisify(writeFile);

import { IDbMeta } from "./db-schema-builder/IDbMeta";

export abstract class AGraphQlHelper {
  public static parseGraphQlSchema(graphQlSchema) {
    try {
      return parse(graphQlSchema, { noLocation: true });
    } catch (err) {
      throw err;
    }
  }

  public static printGraphQlDocument = (gQlDocument: any): string => {
    try {
      return print(gQlDocument);
    } catch (err) {
      throw err;
    }
  };

  public static async writeTableObjectIntoMigrationsFolder(migrationsPath: string, tableObject: IDbMeta, migrationId?: number) {
    // create name for migration
    const timestampMigration = `${migrationsPath}${migrationId || new Date().getTime()}.json`;

    try {
      return await writeFileAsync(timestampMigration, JSON.stringify(tableObject, null, 2), "utf8");
    } catch (err) {
      throw err;
    }
  }
}
