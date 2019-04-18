import { EventEmitter2 } from "eventemitter2";
import { Client as PgClient, Notification } from "pg";
import { Container, Service, Inject } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { IEventEmitterConfig, IEvent, TEventListener } from "./types";

@Service()
export class EventEmitter {
  private readonly config: IEventEmitterConfig;
  private readonly eventEmitter: EventEmitter2;
  private readonly pgClient: PgClient;

  private readonly namespace: string;
  private readonly nodeId: string;

  constructor(@Inject((type) => Config) config: Config, @Inject((type) => BootLoader) bootLoader: BootLoader) {
    this.config = config.registerConfig("Events", `${__dirname}/../config`);
    this.eventEmitter = new EventEmitter2(this.config.eventEmitter);
    this.pgClient = new PgClient(this.config.pgClient);

    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.namespace = env.namespace;
    this.nodeId = env.nodeId;

    bootLoader.onBootReady(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    try {
      await this.pgClient.connect();
      await this.pgClient.on("notification", this.handlePgNotification);
      await this.pgClient.query(`LISTEN ${this.namespace}`);
    } catch (err) {
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
    this.eventEmitter.emit(this.getLocalEventName(eventName), this.nodeId, payload);

    const event: IEvent<TPayload> = {
      name: eventName,
      nodeId: this.nodeId,
      payload
    };
    await this.pgClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
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
}
