import { parse, print, DocumentNode } from "graphql";
import { writeFile } from "fs";
import { promisify } from "util";
const writeFileAsync = promisify(writeFile);

import { IDbMeta } from "./db-schema-builder/IDbMeta";

export abstract class AGraphQlHelper {
  public static parseGraphQlSchema(graphQlSchema: string): DocumentNode {
    try {
      return parse(graphQlSchema, { noLocation: true });
    } catch (err) {
      throw err;
    }
  }

  public static printGraphQlDocument(gQlDocument: DocumentNode): string {
    try {
      return print(gQlDocument);
    } catch (err) {
      throw err;
    }
  };

  public static async writeTableObjectIntoMigrationsFolder(migrationsPath: string, tableObject: IDbMeta, migrationId?: number): Promise<void> {
    const timestamp = new Date().getTime();
    const migrationName = `${migrationsPath}${migrationId || timestamp}.json`;

    try {
      return await writeFileAsync(migrationName, JSON.stringify(tableObject, null, 2), "utf8");
    } catch (err) {
      throw err;
    }
  }
}
