import { ExtensionConnector } from "soniq";
import { GraphQl } from ".";
import { IRuntimeExtension } from "./interfaces";

export class GraphqlExtensionConnector extends ExtensionConnector {
  private _graphQl: GraphQl;
  private _runtimeExtensionKeys: string[] = [];

  public constructor(graphQl: GraphQl) {
    super();
    this._graphQl = graphQl;
  }

  public addRuntimeExtension(runtimeExtension: IRuntimeExtension): void {
    this._runtimeExtensionKeys.push(this._graphQl.addRuntimeExtension(runtimeExtension));
  }

  public detach(): void {
    for (const key of this._runtimeExtensionKeys) {
      this._graphQl.removeRuntimeExtension(key);
    }
  }
}
