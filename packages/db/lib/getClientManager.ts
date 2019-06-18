import { Container } from "@fullstack-one/di";
import { EventEmitter } from "@fullstack-one/events";
import { LoggerFactory } from "@fullstack-one/logger";
import { getConnection } from "typeorm";

export interface IClientManager {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const eventEmitter = Container.get(EventEmitter);
const logger = Container.get(LoggerFactory).create("ORMClientManager");

export default function getClientManager(
  nodeId: string,
  numberOfConnectedClientsChangedCallback: (count: number) => Promise<void>,
  updateClientsIntervalMs: number = 60 * 1000
): IClientManager {
  let updateClientsTimer: NodeJS.Timer = null;
  let knownClientIds: string[] = [nodeId];

  addEventListeners();

  function addEventListeners(): void {
    eventEmitter.onAnyInstance("db.orm.pool.connect.success", updateKnownClients);
    eventEmitter.onAnyInstance("db.orm.pool.end.success", updateKnownClients);
  }

  function removeEventListeners(): void {
    eventEmitter.removeListenerAnyInstance("db.orm.pool.connect.success", updateKnownClients);
    eventEmitter.removeListenerAnyInstance("db.orm.pool.end.success", updateKnownClients);
  }

  function setUpdateClientsInterval(): void {
    if (updateClientsTimer != null) return;
    updateClientsTimer = setInterval(() => updateKnownClients(), updateClientsIntervalMs);
  }

  async function updateKnownClients(): Promise<void> {
    try {
      const databaseName = getConnection().options.database;
      const applicationNamePrefix = eventEmitter.getPgClientApplicationNamePrefix();
      const connectedNodeClients = await getConnection().query(
        `SELECT application_name FROM pg_stat_activity WHERE datname = '${databaseName}' AND application_name LIKE '${applicationNamePrefix}%'`
      );
      const newClientIds = connectedNodeClients.map(({ application_name }) => application_name);
      const currentNumberOfClients = knownClientIds.length;
      const newNumberOfClients = newClientIds.length;
      knownClientIds = newClientIds;
      if (currentNumberOfClients !== newNumberOfClients) {
        logger.debug(`orm.number.of.connected.clients.changed: ${currentNumberOfClients} -> ${newNumberOfClients}`, knownClientIds);
        await numberOfConnectedClientsChangedCallback(newNumberOfClients);
      }
    } catch (err) {
      logger.warn(`orm.updateKnownClients.error:`, err);
    }
  }

  async function start(): Promise<void> {
    setUpdateClientsInterval();
  }

  async function stop(): Promise<void> {
    clearInterval(updateClientsTimer);
    updateClientsTimer = null;
    removeEventListeners();
  }

  return { start, stop };
}
