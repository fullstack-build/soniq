import { Container } from "@fullstack-one/di";
import { EventEmitter } from "@fullstack-one/events";
import { LoggerFactory } from "@fullstack-one/logger";
import NodeJsClient from "../model/NodeJsClient";

export interface IClientManager {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const eventEmitter = Container.get(EventEmitter);
const logger = Container.get(LoggerFactory).create("ORMClientManager");

export default function getClientManager(
  nodeId: string,
  numberOfConnectedClientsChangedCallback: (count: number) => Promise<void>,
  keepAliveIntervalMs: number = 5 * 60 * 1000,
  updateClientsIntervalMs: number = 60 * 1000
): IClientManager {
  let keepAliveTimer: NodeJS.Timer = null;
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

  async function insertMyClient(): Promise<void> {
    await NodeJsClient.insert({ nodeId });
  }

  function setUpdateClientsInterval(): void {
    if (updateClientsTimer != null) return;
    updateClientsTimer = setInterval(() => updateKnownClients(), updateClientsIntervalMs);
  }

  function setKeepAliveInterval(): void {
    if (keepAliveTimer != null) return;
    keepAliveTimer = setInterval(() => NodeJsClient.update({ nodeId }, { nodeId }), keepAliveIntervalMs);
  }

  async function updateKnownClients(): Promise<void> {
    try {
      const connectedNodeClients = await NodeJsClient.find({ where: `"lastOnline" > now() - INTERVAL '10 minutes'` });
      const currentNumberOfClients = knownClientIds.length;
      const newNumberOfClients = connectedNodeClients.length;
      knownClientIds = connectedNodeClients.map((client) => client.nodeId);
      if (currentNumberOfClients !== newNumberOfClients) {
        logger.debug(`orm.number.of.connected.clients.changed: ${currentNumberOfClients} -> ${newNumberOfClients}`, knownClientIds);
        await numberOfConnectedClientsChangedCallback(newNumberOfClients);
      }
    } catch (err) {
      logger.warn(`orm.updateKnownClients.error:`, err);
    }
  }

  async function removeOldClients(): Promise<void> {
    const oldClients = await NodeJsClient.find({ where: `"lastOnline" < now() - INTERVAL '10 minutes'` });
    await NodeJsClient.remove(oldClients);
  }

  async function start(): Promise<void> {
    await removeOldClients();
    await insertMyClient();
    setKeepAliveInterval();
    setUpdateClientsInterval();
  }

  async function stop(): Promise<void> {
    try {
      await NodeJsClient.delete({ nodeId });
    } catch (err) {
      logger.warn(`orm.stop.changed:`, err);
    }
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
    clearInterval(updateClientsTimer);
    updateClientsTimer = null;
    removeEventListeners();
  }

  return { start, stop };
}
