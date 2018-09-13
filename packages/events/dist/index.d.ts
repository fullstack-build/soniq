export interface IEventEmitter {
    emit: (eventName: string, ...args: any[]) => void;
    on: (eventName: string, listener: (...args: any[]) => void) => void;
    onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}
export declare class EventEmitter implements IEventEmitter {
    private config;
    private eventEmitter;
    private nodeId;
    private dbClient;
    private namespace;
    private listenersCache;
    private emittersCache;
    constructor(config: any, bootLoader: any);
    private boot;
    emit(eventName: string, ...args: any[]): void;
    on(eventName: string, listener: (...args: any[]) => void): void;
    onAnyInstance(eventName: string, listener: (...args: any[]) => void): void;
    private _emit;
    private finishInitialisation;
    private sendEventToPg;
    private receiveEventFromPg;
}
