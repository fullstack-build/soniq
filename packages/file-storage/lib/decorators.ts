import { createColumnDecoratorFactory } from "@fullstack-one/db";

export const files = createColumnDecoratorFactory<string[]>({
  getDirective: (inputTypes?: string[]) => {
    const types = inputTypes == null ? ["DEFAULT"] : inputTypes;
    return `@files(types: [${types.map((type) => `"${type}"`).join(",")}])`;
  },
  getColumnOptions: () => ({ gqlType: "[BucketFile]" })
});
