import { Logger, ExtensionConnector } from "../";

export type TCreateModuleExtensionConnectorFunction = (moduleKey: string) => ExtensionConnector;

export type TAttachFunction = (
  logger: Logger,
  createModuleExtensionConnector: TCreateModuleExtensionConnectorFunction
) => void;
export type TDetachFunction = (logger: Logger) => void;

export interface IExtension {
  attach: TAttachFunction;
  detach: TDetachFunction;
}

export type TRegisterFunction = () => IExtension;

export interface IExtensionsAppConfig {
  extensions: IExtensionDefinition[];
}

export interface IExtensionDefinition {
  name: string;
  mainPath: string;
}

export interface ISoniqExtensionContext {
  registerNewExtension: () => void | null;
}
