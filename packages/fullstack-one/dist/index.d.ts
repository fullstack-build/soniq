import 'reflect-metadata';
import { IFullstackOneCore } from './IFullstackOneCore';
export declare class FullstackOneCore implements IFullstackOneCore {
    private config;
    private bootLoader;
    private readonly ENVIRONMENT;
    constructor(bootLoader: any, config: any);
    boot(): Promise<void>;
    private cliArt();
}
