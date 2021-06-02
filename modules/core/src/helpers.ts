/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient } from ".";

const LATEST_MIGRATION_VERSION: string = `SELECT id, version, "versionHash", "runConfig", "createdAt" FROM _core."Migrations" ORDER BY "version" DESC LIMIT $1;`;

export interface ICoreMigration {
  id: string;
  version: number;
  versionHash: string;
  runConfig: any;
  createdAt: string;
}

export async function getLatestNMigrations(
  pgClient: PoolClient,
  numberOfMigrations: number
): Promise<ICoreMigration[]> {
  try {
    const { rows } = await pgClient.query(LATEST_MIGRATION_VERSION, [numberOfMigrations]);

    return rows || [];
  } catch (e) {
    return [];
  }
}

export function drawCliArt(): void {
  process.stdout.write(
    `     
  ___  ___  _ __  _  __ _ 
 / __|/ _ \\| '_ \\| |/ _\` |
 \\__ \\ (_) | | | | | (_| |
 |___/\\___/|_| |_|_|\\__, |
                       | |
                       |_|\n`
  );
  process.stdout.write("____________________________________\n");
}
