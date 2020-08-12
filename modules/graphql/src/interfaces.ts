import { ICustomResolverObject } from ".";
import { IResolverMapping, IGraphqlRuntimeConfig } from "./RuntimeInterfaces";
import { GraphQLSchema } from "graphql";

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

export interface IGetSchemaResult {
  schema: GraphQLSchema;
  runtimeConfig: IGraphqlRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetSchema = (updateKey: string) => Promise<IGetSchemaResult>;
