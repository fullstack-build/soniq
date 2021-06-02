import { PoolClient } from "pg";
import { IAppConfig, IModuleConfig } from "../moduleDefinition/interfaces";
import { IAutoAppConfigFix, IMigrationResult, IMigrationResultWithFixes } from "./interfaces";
import * as _ from "lodash";
import * as crypto from "crypto";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
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

export function applyAutoAppConfigFixes(appConfig: IAppConfig, autoAppConfigFixes: IAutoAppConfigFix[]): IAppConfig {
  const newAppConfig: IAppConfig = JSON.parse(JSON.stringify(appConfig));

  const indexByModuleKey: {
    [key: string]: number;
  } = {};

  newAppConfig.modules.forEach((moduleConfig: IModuleConfig, index: number) => {
    indexByModuleKey[moduleConfig.key] = index;
  });

  autoAppConfigFixes.forEach((autoAppConfigFix) => {
    const moduleIndex: number = indexByModuleKey[autoAppConfigFix.moduleKey];

    newAppConfig.modules[moduleIndex].appConfig = _.set(
      newAppConfig.modules[moduleIndex].appConfig,
      autoAppConfigFix.path,
      autoAppConfigFix.value
    );
  });

  return newAppConfig;
}

export function buildMigrationResult(
  migrationResult: IMigrationResult,
  autoAppConfigFixes?: IAutoAppConfigFix[],
  fixedAppConfig?: IAppConfig | null
): IMigrationResultWithFixes {
  const result: IMigrationResultWithFixes = {
    commands: migrationResult.commands,
    errors: migrationResult.errors,
    warnings: migrationResult.warnings,
    autoAppConfigFixes: autoAppConfigFixes || [],
  };

  if (fixedAppConfig != null) {
    result.fixedAppConfig = fixedAppConfig;
  }

  return result;
}
