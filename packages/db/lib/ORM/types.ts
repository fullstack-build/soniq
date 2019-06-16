import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export interface IOrmConfig {
  connection: PostgresConnectionOptions;
  pool: {
    min: number;
    max: number;
    globalMax: number;
    updateClientListInterval: number;
  };
}
