import { IOrmConfig } from "./ORM/types";

export interface IDbConfig {
  automigrate: boolean;
  renameInsteadOfDrop: boolean;
  viewSchemaName: string;
  general: IDbGeneralPoolConfig;
  orm: IOrmConfig;
}

export interface IDbGeneralPoolConfig {
  database: string;
  host: string;
  user: string;
  password: string;
  port: number;
  ssl: boolean;
  globalMax: number;
  min: number;
  updateClientListInterval: number;
}
