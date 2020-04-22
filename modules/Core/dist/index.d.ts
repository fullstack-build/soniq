import "reflect-metadata";
import { Service, Container, ContainerInstance, Inject, InjectMany } from "typedi";
export { Service, Container, ContainerInstance, Inject, InjectMany };
import { Logger } from "tslog";
import { ConfigManager, IEnvironment } from "./ConfigManager";
export { IEnvironment };
export { Logger };
export declare class Core {
    private readonly _className;
    private readonly _bootLoader;
    private readonly _logger;
    readonly configManager: ConfigManager | undefined;
    readonly ENVIRONMENT: IEnvironment;
    constructor();
    private _drawCliArt;
    boot(): Promise<void>;
    getLogger(name?: string, minLevel?: number, exposeStack?: boolean): Logger;
}
//# sourceMappingURL=index.d.ts.map