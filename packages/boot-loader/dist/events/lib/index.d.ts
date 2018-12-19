export interface IEventEmitter {
    emit: (eventName: string, ...args: any[]) => void;
    on: (eventName: string, listener: (...args: any[]) => void) => void;
    onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}
export declare class EventEmitter implements IEventEmitter {
    private config;
    private readonly CONFIG;
    private eventEmitter;
    private readonly THIS_NODE_ID_PLACEHOLDER;
    private nodeId;
    private dbClient;
    private readonly namespace;
    private listenersCache;
    private emittersCache;
    constructor(config: any, bootLoader: any);
    private boot;
    private finishInitialisation;
    private receiveEventFromPg;
    private _emit;
    private sendEventToPg;
    private _on;
    emit(eventName: string, ...args: any[]): void;
    on(eventName: string, callback: (nodeId: string, ...args: any[]) => void): void;
    once(eventName: string, callback: (nodeId: string, ...args: any[]) => void): void;
    removeListener(eventName: string, callback: (nodeId: string, ...args: any[]) => void): void;
    removeAllListeners(eventName: string): void;
    onAnyInstance(eventName: string, callback: (nodeId: string, ...args: any[]) => void): void;
    onceAnyInstance(eventName: string, callback: (nodeId: string, ...args: any[]) => void): void;
    removeListenerAnyInstance(eventName: string, callback: (nodeId: string, ...args: any[]) => void): void;
    removeAllListenersAnyInstance(eventName: string): void;
}
