interface IOptions<TParams> {
  name: string;
  generate: (params: TParams, getField: (fieldName: string) => string) => string;
  gqlReturnType: string;
}

type TExpressionDefinitionFn<TParams> = (options: IOptions<TParams>) => TExpressionFn<TParams>

type TExpressionFn<TParams> = (params?: TParams) => IExpression;

interface IExpression {
  sql: string;
  name: string;
}

export function defineExpression<TParams = undefined>(options: IOptions<TParams>): TExpressionFn<TParams> {

  let requiresLateral = false;
  let tableName = "someTableName";

  function getField(fieldName: string): string {
    requiresLateral = true;
    return `"${tableName}"."${fieldName}"`;
  }

  return (params: TParams): IExpression => {
    const nameSuffix = Object.values(params).join("_");
    return {
      sql: options.generate(params, getField),
      name: nameSuffix === "" ? options.name : `${options.name}_${nameSuffix}`
    }
  }
}

export const ColumnPermission: any = () => null;
