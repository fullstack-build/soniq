import { EventEmitter2 } from "eventemitter2";
import { Client as PgClient, Notification, ClientConfig } from "pg";
import { Container, Service, Inject } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
// import { BootLoader } from "@fullstack-one/boot-loader";
import { IEventEmitterConfig, IEvent, TEventListener } from "./types";

@Service()
export class EventEmitter {
  private readonly config: IEventEmitterConfig;
  private readonly logger: ILogger;
  private readonly eventEmitter: EventEmitter2;
  private readonly pgClient: PgClient;

  private readonly namespace: string;
  private readonly nodeId: string;

  constructor(
    @Inject((type) => Config) config: Config,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    // @Inject((type) => BootLoader) bootLoader: BootLoader
  ) {
    this.config = config.registerConfig("Events", `${__dirname}/../config`);
    this.logger = loggerFactory.create(this.constructor.name);

    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.namespace = env.namespace;
    this.nodeId = env.nodeId;

    this.eventEmitter = new EventEmitter2({ ...this.config.eventEmitter, wildcard: true });
    const clientConfig = { ...this.config.pgClient, application_name: `${this.getPgClientApplicationNamePrefix()}_${this.nodeId}` };
    this.pgClient = new PgClient(clientConfig as ClientConfig);

    // bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    try {
      await this.pgClient.connect();
      this.logger.debug("pgClient.connected");
      this.pgClient.on("notification", this.handlePgNotification.bind(this));
      await this.pgClient.query(`LISTEN ${this.namespace}`);
      this.logger.debug("pgClient.listen", this.namespace);
    } catch (err) {
      this.logger.debug("pgClient.connecting.or.listening.error", err);
      throw err;
    }
  }

  private handlePgNotification({ channel, payload: stringifiedEvent }: Notification): void {
    if (channel !== this.namespace) return;
    const event: IEvent = JSON.parse(stringifiedEvent);
    if (this.isMyEvent(event) === false) this.eventEmitter.emit(event.name, event.nodeId, event.payload);
  }

  private isMyEvent({ nodeId }: IEvent): boolean {
    return nodeId === this.nodeId;
  }

  private getLocalEventName(eventName: string): string {
    return `${this.nodeId}.${eventName}`;
  }

  private getGlobalEventName(eventName: string): string {
    return `*.${eventName}`;
  }

  public async emit<TPayload>(eventName: string, payload?: TPayload): Promise<void> {
    const localEventName = this.getLocalEventName(eventName);
    this.eventEmitter.emit(localEventName, this.nodeId, payload);

    const event: IEvent<TPayload> = {
      name: localEventName,
      nodeId: this.nodeId,
      payload
    };
    await this.pgClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
  }

  public getPgClientApplicationNamePrefix(): string {
    return `${this.namespace}_events`;
  }

  public on<TPayload>(eventName: string, callback: TEventListener<TPayload>) {
    this.eventEmitter.on(this.getLocalEventName(eventName), callback);
  }

  public once<TPayload>(eventName: string, callback: TEventListener<TPayload>) {
    this.eventEmitter.once(this.getLocalEventName(eventName), callback);
  }

  public removeListener<TPayload>(eventName: string, callback: TEventListener<TPayload>) {
    this.eventEmitter.removeListener(this.getLocalEventName(eventName), callback);
  }

  public removeAllListeners(eventName: string) {
    this.eventEmitter.removeAllListeners(this.getLocalEventName(eventName));
  }

  public onAnyInstance<TPayload>(eventName: string, callback: TEventListener<TPayload>) {
    this.eventEmitter.on(this.getGlobalEventName(eventName), callback);
  }

  public onceAnyInstance<TPayload>(eventName: string, callback: TEventListener<TPayload>) {
    this.eventEmitter.once(this.getGlobalEventName(eventName), callback);
  }

  public removeListenerAnyInstance<TPayload>(eventName: string, callback: TEventListener<TPayload>) {
    this.eventEmitter.removeListener(this.getGlobalEventName(eventName), callback);
  }

  public removeAllListenersAnyInstance(eventName: string) {
    this.eventEmitter.removeAllListeners(this.getGlobalEventName(eventName));
  }

  public async end(): Promise<void> {
    try {
      await this.pgClient.end();
      this.logger.debug("pgClient.ended");
    } catch (err) {
      this.logger.debug("pgClient.ending.error", err);
      throw err;
    }
  }
}
