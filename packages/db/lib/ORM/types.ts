import { ConnectionOptions } from "typeorm";
import { GqlFieldType } from "./decorators/ModelMeta";

export interface IOrmConfig {
  connection: ConnectionOptions;
  pool: {
    min: number;
    max: number;
    globalMax: number;
    updateClientListInterval: number;
  };
}

export interface IFieldOptions {
  type: GqlFieldType;
  unique?: boolean;
  username?: boolean;
  password?: boolean;
  computed?: {
    expression: string;
    params?: any;
  };
  otherDirective?: string;
  otherDirectives?: string[];
}
