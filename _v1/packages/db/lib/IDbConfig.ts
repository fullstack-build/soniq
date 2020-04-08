import * as typeorm from "typeorm";

export interface IDbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: Array<string | (new () => any) | typeorm.EntitySchema<any>>;
  synchronize: boolean;
  synchronizeGraphQl: boolean;
  logging: boolean;
  min: number;
  max: number;
  globalMax: number;
  updateClientListInterval: number;
}
