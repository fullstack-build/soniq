export interface IDb {
  create: () => Promise<any>;
  end: () => Promise<void>;
}
