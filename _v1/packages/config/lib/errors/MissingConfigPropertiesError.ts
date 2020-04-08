export class MissingConfigPropertiesError extends Error {
  public readonly missingProperties: string[];

  constructor(moduleName: string, missingProperties: string[]) {
    super();
    this.message += `config.not.set ${missingProperties.map((prop) => `${moduleName}.${prop}`).join(", ")}`;
    this.missingProperties = missingProperties;
  }
}
