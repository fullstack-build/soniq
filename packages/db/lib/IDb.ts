import { ClientConfig, Client } from "pg";

export interface IDb {
  connect?: (pCredentials: ClientConfig) => Promise<Client>;
  end: () => Promise<void>;
}
