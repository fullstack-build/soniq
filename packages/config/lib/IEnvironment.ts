export interface IEnvironment {
  frameworkVersion: string;
  NODE_ENV: string;
  name: string;
  path: string;
  version: string;
  namespace: string;
  nodeId: string; // unique instance ID (6 char)
}
