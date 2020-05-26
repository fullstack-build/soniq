/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient } from ".";

const LATEST_MIGRATION_VERSION: string = `SELECT id, version, "runtimeConfig", "createdAt" FROM _core."Migrations" ORDER BY "createdAt" DESC LIMIT 1;`;

export interface ICoreMigration {
  id: string;
  version: string;
  runtimeConfig: any;
  createdAt: string;
}

export async function getLatestMigrationVersion(pgClient: PoolClient): Promise<ICoreMigration> {
  const { rows } = await pgClient.query(LATEST_MIGRATION_VERSION);

  return rows[0];
}
