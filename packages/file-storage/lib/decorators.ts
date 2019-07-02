import { createColumnDecoratorFactory } from "@fullstack-one/db";

export const files = createColumnDecoratorFactory<string[]>({
  getDirective: (inputTypes?: string[]) => {
    const types = getTypes(inputTypes);
    return `@files(types: [${types.map((type) => `"${type}"`).join(",")}])`;
  },
  getColumnOptions: () => ({ type: "jsonb", gqlType: "[BucketFile]", nullable: true }),
  getExtension: (inputTypes: string[]) => {
    const types = getTypes(inputTypes);
    return ["files", types];
  }
});

function getTypes(inputTypes?: string[]): string[] {
  return inputTypes == null ? ["DEFAULT"] : inputTypes;
}
