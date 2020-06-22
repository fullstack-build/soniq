import { SoniqModule } from "../Application";
import { IExtensionDefinition } from "./interfaces";
import { IModuleConfig } from "../interfaces";

export class ExtensionsModule extends SoniqModule {
  private _extensions: IExtensionDefinition[];

  public constructor(extensions: IExtensionDefinition[]) {
    super("Extensions");

    this._extensions = extensions;
  }

  public _build(appId: string): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: {
        extensions: this._extensions,
      },
    };
  }
}
