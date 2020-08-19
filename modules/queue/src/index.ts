import { Core, DI, Logger, Pool, PoolClient } from "soniq";
import * as PgBoss from "pg-boss";
import { IQueueRuntimeConfig, TGetQueueModuleRuntimeConfig } from "./interfaces";

@DI.injectable()
export class Queue {
  private _queueRuntimeConfig: IQueueRuntimeConfig | null = null;
  private _core: Core;
  private _logger: Logger;
  private _pgPool: Pool | null = null;

  public constructor(@DI.inject(Core) core: Core) {
    this._core = core;

    this._logger = core.getLogger("Queue");

    this._core.addCoreFunctions({
      key: this.constructor.name,
      //migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
      //createExtensionConnector: this._createExtensionConnector.bind(this),
    });
  }

  private async _boot(getRuntimeConfig: TGetQueueModuleRuntimeConfig, pgPool: Pool): Promise<void> {
    this._pgPool = pgPool;

    // Add `close` and `executeSql` functions for PgBoss to function
    const dbClient: PoolClient = await pgPool.connect();
    const pgBossDB: {
      close: () => void;
      executeSql(text: string, values: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
    } = {
      close: () => dbClient.release(),
      executeSql: async (text: string, values: unknown[]): Promise<{ rows: unknown[]; rowCount: number }> =>
        (dbClient.query(text, values) as unknown) as {
          rows: unknown[];
          rowCount: number;
        },
    };

    const schemaName: string = "_queue";
    const queue: PgBoss = new PgBoss({ db: pgBossDB, schema: schemaName });
    queue.on("error", (error) => this._logger.error(error));
    await queue.start();
    console.log("### boot queue", queue);
  }
}
