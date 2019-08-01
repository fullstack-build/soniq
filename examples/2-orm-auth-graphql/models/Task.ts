import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Field, Type, UpdateDateColumn } from "@fullstack-one/db";
import { QueryPermissions, MutationPermissions } from "@fullstack-one/schema-builder";
import User from "./User";
import { anyone, owner, authenticated } from "../expressions";

@Entity()
@MutationPermissions<Task>({
  createViews: {
    me: {
      fields: ["title", "user"],
      expressions: anyone()
    }
  },
  updateViews: {
    me: {
      fields: ["id", "title", "user"],
      expressions: owner({ field: "userId" })
    },
    others: {
      fields: ["id", "user"],
      expressions: authenticated()
    }
  },
  deleteExpressions: owner({ field: "userId" })
})
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  @QueryPermissions(anyone())
  public id: string;

  @CreateDateColumn()
  @QueryPermissions(anyone())
  public createdAt: string;

  @UpdateDateColumn()
  @QueryPermissions(anyone())
  public updatedAt: string;

  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions([anyone(), owner({ field: "userId" })])
  public title: string;

  @ManyToOne((type) => User, "tasks", { nullable: true })
  @QueryPermissions([anyone()])
  public user?: User;

  @Column({ type: "json", gqlType: "Details" })
  @QueryPermissions(["Anyone"])
  public details: Details;
}

@Type()
class Details {
  @Field("String")
  public info: string;

  @Field("String")
  public extras: string;
}
