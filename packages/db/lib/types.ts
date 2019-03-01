import { ClientConfig, Client } from "pg";

export interface IDb {
  connect?: (pCredentials: ClientConfig) => Promise<Client>;
  end: () => Promise<void>;
}

export type THookFunction = (applicationName: string) => void;
export type TErrorHookFunction = (applicationName: string, err: any) => void;
