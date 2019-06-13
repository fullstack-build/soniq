import { ConnectionOptions } from "typeorm";

export interface IOrmConfig {
  connection: ConnectionOptions;
  pool: {
    min: number;
    max: number;
    globalMax: number;
    updateClientListInterval: number;
  };
}
