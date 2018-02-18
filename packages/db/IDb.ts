import { ClientConfig } from 'pg';

export interface IDb {
  connect: (pCredentials: ClientConfig) => Promise<any>;
  end: () => Promise<void>;
}
