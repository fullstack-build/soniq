export declare function parsePermission(
  permission: any,
  context: any,
  extensions: any,
  config: any
): {
  gqlDocument: any;
  meta: {
    query: {};
    mutation: {};
    permissionMeta: {};
  };
  sql: any[];
};
