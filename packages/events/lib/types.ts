export interface IEventEmitterConfig {
  eventEmitter: {
    wildcard: boolean;
    delimiter: string;
    newListener: boolean;
    maxListeners: number;
    verboseMemoryLeak: boolean;
  };
  pgClient: {
    database: string;
    host: string;
    user: string;
    password: string;
    port: number;
    ssl: boolean;
  };
}

export interface IEvent<TPayload = any> {
  name: string;
  nodeId: string;
  payload?: TPayload;
}

export type TEventListener<TPayload = any> = (nodeId: string, payload?: TPayload) => void;
