import { ICustomResolverObject } from ".";
import { IResolverMapping } from "./RuntimeInterfaces";

export interface IRuntimeExtension {
  resolverObject?: ICustomResolverObject;
  resolverMappings?: IResolverMapping[];
  schemaExtensions?: string[];
}

export interface IGetRuntimeExtensionsResult {
  runtimeExtensions: IRuntimeExtension[];
  hasBeenUpdated: boolean;
}

export type TGetRuntimeExtensions = (updateKey?: string) => IGetRuntimeExtensionsResult;
