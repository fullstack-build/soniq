import { createColumnDecoratorFactory } from "@fullstack-one/db";

interface IOptions<TParams = any> {
  expression: string;
  params?: TParams;
  gqlType: string;
}

export const computed = createColumnDecoratorFactory<IOptions>({
  getDirective: ({ expression, params }) => {
    if (params == null) return `@computed(expression: "${expression}")`;
    return `@computed(expression: "${expression}", params: ${JSON.stringify(params)})`;
  },
  getColumnOptions: ({ gqlType }) => ({ gqlType })
});
