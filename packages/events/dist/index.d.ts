import * as ONE from 'fullstack-one';
export interface IEventEmitter {
    emit: (eventName: string, ...args: any[]) => void;
    on: (eventName: string, listener: (...args: any[]) => void) => void;
    onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}
export declare class EventEmitter extends ONE.AbstractPackage implements IEventEmitter {
    private eventEmitter;
    private nodeId;
    private dbClient;
    private namespace;
    constructor();
    emit(eventName: string, ...args: any[]): void;
    on(eventName: string, listener: (...args: any[]) => void): void;
    onAnyInstance(eventName: string, listener: (...args: any[]) => void): void;
    private _emit(eventName, instanceId, ...args);
    private finishInitialisation();
    private sendEventToPg(eventName, ...args);
    private receiveEventFromPg(msg);
}
