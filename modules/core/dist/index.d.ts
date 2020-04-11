import "reflect-metadata";
import { Service, Container, ContainerInstance, Inject, InjectMany } from "typedi";
export { Service, Container, ContainerInstance, Inject, InjectMany };
import { ConfigManager, IEnvironment } from "./ConfigManager";
export { IEnvironment };
export declare class Core {
    private readonly bootLoader;
    readonly configManager: ConfigManager;
    readonly ENVIRONMENT: IEnvironment;
    private constructor();
    private drawCliArt;
    boot(): Promise<void>;
}
