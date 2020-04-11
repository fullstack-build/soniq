import "reflect-metadata";
import { Service, Container, ContainerInstance, Inject, InjectMany } from "typedi";
export { Service, Container, ContainerInstance, Inject, InjectMany };
export declare class Core {
    private readonly bootLoader;
    private constructor();
    private drawCliArt;
    boot(): Promise<void>;
}
