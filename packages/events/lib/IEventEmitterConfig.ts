export interface IEventEmitterConfig {
  namespace: string;
  eventEmitter: {
    wildcard: boolean;
    delimiter: string;
    newListener: boolean;
    maxListeners: number;
    verboseMemoryLeak: boolean;
  };
}
