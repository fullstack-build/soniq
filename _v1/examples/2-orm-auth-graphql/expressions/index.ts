import { defineExpression } from "@fullstack-one/schema-builder";

export const currentUserId = defineExpression({
  name: "currentUserId",
  type: "function",
  gqlReturnType: "ID",
  requiresAuth: true,
  generate: (context, params): string => {
    return `_auth.current_user_id()`;
  }
});

export const owner = defineExpression<{ field: string }>({
  name: "Owner",
  type: "expression",
  gqlReturnType: "Boolean",
  getNameWithParams: (params: any = {}): string => {
    if (params.field != null) {
      return `Owner_${params.field}`;
    }
    return "Owner";
  },
  generate: (context, params: any = {}): string => {
    const field = params.field || "ownerId";
    return `${context.getField(field)} = ${context.getExpression(currentUserId())}`;
  }
});

export const authenticated = defineExpression({
  name: "Authenticated",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params): string => {
    return `${context.getExpression(currentUserId())} IS NOT NULL`;
  }
});

export const anyone = defineExpression({
  name: "Anyone",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params): string => {
    return `TRUE`;
  }
});
