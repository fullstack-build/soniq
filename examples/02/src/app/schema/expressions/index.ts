import { Expression } from "@soniq/graphql";

export const currentUserId: Expression = new Expression({
  gqlReturnType: "Boolean",
  authRequired: true,
  generateSql: (getExpression, getColumn) => {
    return `_auth.current_user_id()`;
  },
});

const OwnerFactory: (columnName: string) => Expression = (columnName: string) => {
  return new Expression({
    gqlReturnType: "Boolean",
    authRequired: true,
    generateSql: (getExpression, getColumn) => {
      return `${getExpression(currentUserId)} = ${getColumn(columnName)}`;
    },
  });
};

export const anyone: Expression = new Expression({
  gqlReturnType: "Boolean",
  generateSql: (getExpression, getColumn) => {
    return `TRUE`;
  },
});

export const ownerById: Expression = OwnerFactory("id");
export const ownerByOwnerId: Expression = OwnerFactory("ownerId");
