/* eslint-disable @typescript-eslint/naming-convention */
import { PoolClient } from "soniq";

const EXISTS_QUERY: string = `
SELECT EXISTS (
   SELECT 1
	   FROM   information_schema.tables 
	   WHERE  table_schema = '_file_storage'
	   AND    table_name = 'Settings'
   ) "exists";
`;

async function doesSettingsTableExist(pgClient: PoolClient): Promise<boolean> {
  const { rows } = await pgClient.query(EXISTS_QUERY);

  return rows[0] != null && rows[0].exists != null && rows[0].exists === true;
}

export interface ISettings {
  max_temp_files_per_user?: string;
}

export async function getCurrentSettings(pgClient: PoolClient): Promise<ISettings> {
  const settingsTableExists: boolean = await doesSettingsTableExist(pgClient);
  const settings: ISettings = {};

  if (settingsTableExists) {
    const { rows } = await pgClient.query(`SELECT key, value FROM _file_storage."Settings";`);

    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
  }

  return settings;
}
