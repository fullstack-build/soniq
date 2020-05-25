export interface IEnvironment {
  readonly frameworkVersion: string;
  readonly NODE_ENV: string;
  readonly name: string | undefined;
  readonly path: string;
  readonly version: string | undefined;
  readonly namespace: string;
  readonly nodeId: string; // unique instance ID (6 char)
}
