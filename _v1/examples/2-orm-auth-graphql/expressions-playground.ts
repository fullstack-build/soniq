import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@fullstack-one/db";
import { QueryPermissions, IExpressionContext } from "@fullstack-one/schema-builder";
import { SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER } from "constants";

const currentExpressions = [
  {
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
      return `${context.getField(field)} = ${context.getExpression("currentUserId")}`;
    }
  },
  {
    name: "currentUserId",
    type: "function",
    gqlReturnType: "ID",
    requiresAuth: true,
    generate: (context, params): string => {
      return `_auth.current_user_id()`;
    }
  }
];

const currentUserId = new Expreesion({
  name: "bluibabla",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params): string => {
    return `current_user_id()`;
  }
});

export const authenticated = {
  name: "Authenticated",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params): string => {
    return `${context.getExpression(currentExpressions)} IS NOT NULL`;
  }
};

import * as expr from "./expressions";

expr.authenticated;

const expr = new Expression({
  name: "Authenticated",
  type: "expression",
  gqlReturnType: "Boolean",
  generate: (context, params): string => {
    return `${context.getExpression(currentUserId)} IS NOT NULL`;
  }
});

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @QueryPermissions(authenticated)
  public name: string;

  @Column()
  @QueryPermissions(owner({ field: "id" }))
  public bankAccount: User;
}
