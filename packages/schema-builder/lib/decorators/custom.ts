import { createColumnDecoratorFactory } from "@fullstack-one/db";

interface IOptions {
  resolver: string;
  gqlType: string;
}

// tslint:disable-next-line:variable-name
export const Custom = createColumnDecoratorFactory<IOptions>({
  getDirective: ({ resolver }) => {
    return `@custom(resolver: "${resolver}")`;
  },
  getColumnOptions: ({ gqlType }) => ({ gqlType })
});
