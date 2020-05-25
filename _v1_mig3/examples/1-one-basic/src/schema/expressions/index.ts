import { Expression } from "@fullstack-one/graphql";

export const currentUserId = new Expression({
  gqlReturnType: "Boolean",
  authRequired: true,
  generateSql: (getExpression, getColumn) => {
    return `_auth.current_user_id()`;
  }
});

const OwnerFactory = (columnName: string) => {
  return new Expression({
    gqlReturnType: "Boolean",
    authRequired: true,
    generateSql: (getExpression, getColumn) => {
      return `${getExpression(currentUserId)} = ${getColumn(columnName)}`;
    }
  });
}

export const anyone = new Expression({
  gqlReturnType: "Boolean",
  generateSql: (getExpression, getColumn) => {
    return `TRUE`;
  }
})

export const ownerById = OwnerFactory("id");
export const ownerByOwnerId = OwnerFactory("ownerId");