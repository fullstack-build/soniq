import { LoggerFactory } from "@fullstack-one/logger";
import * as Minio from "minio";
import { Verifier, IBucketObject } from "./Verifier";
import { DefaultVerifier } from "./DefaultVerifier";
import { FileName } from "./FileName";
export { DefaultVerifier, Verifier, Minio, IBucketObject, FileName };
import "./migrationExtension";
export declare class FileStorage {
  private client;
  private fileStorageConfig;
  private dbGeneralPool;
  private server;
  private graphQl;
  private schemaBuilder;
  private loggerFactory;
  private logger;
  private config;
  private auth;
  private verifiers;
  private verifierObjects;
  constructor(
    loggerFactory: LoggerFactory,
    dbGeneralPool?: any,
    server?: any,
    bootLoader?: any,
    config?: any,
    graphQl?: any,
    schemaBuilder?: any,
    auth?: any
  );
  private boot;
  private postMutationHook;
  private presignedPutObject;
  private presignedGetObject;
  private deleteFileAsAdmin;
  private deleteFile;
  private deleteObjects;
  private getResolvers;
  addVerifier(type: any, fn: any): void;
}
