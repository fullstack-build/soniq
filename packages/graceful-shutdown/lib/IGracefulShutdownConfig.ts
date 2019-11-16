export interface IGracefulShutdownConfig {
  active: boolean;
  healthCheckLivenessPath?: string;
  healthCheckReadinessPath?: string;
}
