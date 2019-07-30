import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@fullstack-one/db";
import { defineExpression, ColumnPermission } from "./expression";

const currentUserId = defineExpression({
  name: "currentUserId",
  gqlReturnType: "ID",
  generate: () => {
    return `_auth.current_user_id()`;
  }
});

const owner = defineExpression<{ field?: string }>({
  name: "Owner",
  gqlReturnType: "Boolean",
  generate: (params: { field?: string }, getField) => {
    const field = params.field || "ownerId";
    return `${getField(field)} = ${currentUserId().sql}`;
  }
});

const authenticated = defineExpression({
  name: "Anyone",
  gqlReturnType: "Boolean",
  generate: () => {
    return `${currentUserId().sql} IS NOT NULL`;
  }
});

const defaultPermissions = { read: [authenticated()] };

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ColumnPermission(defaultPermissions)
  public id: number;

  @Column()
  @ColumnPermission(defaultPermissions)
  public name: string;
  
  @Column()
  @ColumnPermission(defaultPermissions, { read: [owner({ field: "id" })] })
  public bankAccount: User;
}

