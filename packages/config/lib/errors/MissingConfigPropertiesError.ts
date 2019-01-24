export class MissingConfigPropertiesError extends Error {
  public readonly missingProperties: string[];

  constructor(missingProperties: string[]) {
    super();
    this.message += missingProperties.join(", ");
    this.missingProperties = missingProperties;
  }
}
