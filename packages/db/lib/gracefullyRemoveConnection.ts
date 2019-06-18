import { Connection, QueryRunner, getConnectionManager } from "typeorm";
import { PostgresDriver } from "typeorm/driver/postgres/PostgresDriver";

export default async function gracefullyRemoveConnection(connection: Connection): Promise<void> {
  const tempConnectionName = `oldConnection-${Math.random()}`;
  (connection as any).name = tempConnectionName;
  await afterQueryRunnersRelease(connection);
  await connection.close();
  const connectionManager = getConnectionManager();
  (connectionManager as any).connections = connectionManager.connections.filter(({ name }) => name !== tempConnectionName);
}

async function afterQueryRunnersRelease(connection: Connection): Promise<void> {
  const driver = connection.driver as PostgresDriver;
  const queryRunners = driver.connectedQueryRunners;
  queryRunners.forEach((runner: QueryRunner & { afterRelease: Promise<void>; releaseNatively(): Promise<void> }) => {
    let resolve: () => void;
    runner.afterRelease = new Promise<void>((res) => {
      resolve = res;
    });
    runner.releaseNatively = runner.release;
    runner.release = (): Promise<void> => {
      return runner.releaseNatively().then(() => resolve());
    };
  });
  await Promise.all(queryRunners.map((runner: QueryRunner & { afterRelease: Promise<void> }) => runner.afterRelease));
}
