import { createColumnDecoratorFactory } from "@fullstack-one/db";
import { IPermission, IExpressionInput, IMutationViewsByName } from "./gql-schema-builder/interfaces";

interface IOptions<TParams = any> {
  name: string;
  params?: TParams;
  gqlType: string;
}

// tslint:disable-next-line:variable-name
export const Computed = createColumnDecoratorFactory<IOptions>({
  getDirective: ({ name, params }) => {
    if (params == null) return `@computed(expression: "${name}")`;
    return `@computed(expression: "${name}", params: ${JSON.stringify(params)})`;
  },
  getColumnOptions: ({ gqlType }) => ({ gqlType })
});

// tslint:disable-next-line:function-name
export function QueryPermissions(readExpressions: IExpressionInput) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    addQueryPermissions(entityName, columnName, readExpressions);
  };
}

interface IMutationPermissions<TClass> {
  createViews?: IMutationViewsByName<TClass>;
  updateViews?: IMutationViewsByName<TClass>;
  deleteExpressions?: IExpressionInput;
}

// tslint:disable-next-line:function-name
export function MutationPermissions<TClass>(options: IMutationPermissions<TClass>) {
  return (target: any) => {
    const entityName = target.name;
    addMutationPermissions<TClass>(entityName, options);
    return target;
  };
}

const permissions: { [gqlTypeName: string]: IPermission } = {};

function addQueryPermissions(gqlTypeName: string, columnName: string, readExpressions: IExpressionInput) {
  const permission = getPermissionAndCreateIfNotExist(gqlTypeName);
  permission.readExpressions = {
    ...permission.readExpressions,
    [columnName]: readExpressions
  };
}

function addMutationPermissions<TClass>(gqlTypeName: string, options: IMutationPermissions<TClass>): void {
  const permission = getPermissionAndCreateIfNotExist<TClass>(gqlTypeName);
  permission.createViews = options.createViews;
  permission.updateViews = options.updateViews;
  permission.deleteExpressions = options.deleteExpressions;
}

function getPermissionAndCreateIfNotExist<TClass = any>(gqlTypeName: string): IPermission<TClass> {
  if (permissions[gqlTypeName] == null) {
    permissions[gqlTypeName] = {
      gqlTypeName
    };
  }
  return permissions[gqlTypeName] as IPermission<TClass>;
}

export function getDecoratorPermissions(): IPermission[] {
  return Object.values(permissions);
}
