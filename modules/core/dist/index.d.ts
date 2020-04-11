import "reflect-metadata";
import { Service, Container } from "typedi";
export { Service, Container };
export declare class Core {
    private readonly bootLoader;
    private constructor();
    private drawCliArt;
    boot(): Promise<void>;
}
