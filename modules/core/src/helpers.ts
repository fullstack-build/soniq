/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient } from "pg";
import { IAppConfig, IAutoAppConfigFix, IMigrationResult, IMigrationResultWithFixes } from "./interfaces";
import * as _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function asyncForEach(array: any, callback: any): Promise<any> {
  // tslint:disable-next-line:no-increment-decrement
  for (let index: number = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function getPgSelector(selector: string): string {
  if (selector.toLowerCase() === selector && selector.match("-") == null) {
    return selector;
  }
  return `"${selector}"`;
}

export async function getSchemas(pgClient: PoolClient): Promise<string[]> {
  const { rows } = await pgClient.query(`SELECT schema_name FROM information_schema.schemata;`);

  return rows.map((row) => {
    return row.schema_name;
  });
}

export async function getExtensions(pgClient: PoolClient): Promise<string[]> {
  const { rows } = await pgClient.query(`SELECT extname FROM pg_extension;`);

  return rows.map((row) => {
    return row.extname;
  });
}

export const GET_TABLES: string = `
  SELECT 
    table_name "name"
  FROM information_schema.tables 
  WHERE table_type = 'BASE TABLE' AND $1 @> ARRAY[table_schema::text];
`;

export async function getTables(dbClient: PoolClient, schemas: string[]): Promise<string[]> {
  const { rows } = await dbClient.query(GET_TABLES, [schemas]);

  return rows.map((row) => {
    return row.name;
  });
}

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

export function applyAutoAppConfigFixes(appConfig: IAppConfig, autoAppConfigFixes: IAutoAppConfigFix[]): IAppConfig {
  const newAppConfig: IAppConfig = JSON.parse(JSON.stringify(appConfig));

  autoAppConfigFixes.forEach((autoAppConfigFix) => {
    _.set(newAppConfig, autoAppConfigFix.path, autoAppConfigFix.value);
  });

  return newAppConfig;
}

export function castMigrationResult(
  migrationResult: IMigrationResult | IMigrationResultWithFixes | any
): IMigrationResultWithFixes {
  const result: IMigrationResultWithFixes = {
    commands: migrationResult.commands,
    errors: migrationResult.errors,
    warnings: migrationResult.warnings,
  };

  if (migrationResult.autoAppConfigFixes != null) {
    result.autoAppConfigFixes = migrationResult.autoAppConfigFixes;
  }

  if (migrationResult.fixedAppConfig != null) {
    result.fixedAppConfig = migrationResult.fixedAppConfig;
  }

  return result;
}
