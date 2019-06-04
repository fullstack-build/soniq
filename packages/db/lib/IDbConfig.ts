export interface IDbConfig {
  automigrate: boolean;
  renameInsteadOfDrop: boolean;
  viewSchemaName: string;
  appClient: IDbAppClientConfig;
  general: IDbGeneralPoolConfig;
  orm: any;
}

export interface IDbAppClientConfig {
  database: string;
  host: string;
  user: string;
  password: string;
  port: number;
  ssl: boolean;
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
