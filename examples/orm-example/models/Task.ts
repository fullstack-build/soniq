import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "@fullstack-one/db";
import { QueryPermissions, MutationPermissions } from "@fullstack-one/schema-builder";
import User from "./User";

@Entity()
@MutationPermissions<Task>({
  createViews: {
    me: {
      fields: ["title", "user"],
      expressions: "Anyone"
    }
  },
  updateViews: {
    me: {
      fields: ["id", "title", "user"],
      expressions: { name: "Owner", params: { field: "user" } }
    },
    others: {
      fields: ["id", "user"],
      expressions: "Authenticated"
    }
  },
  deleteExpressions: { name: "Owner", params: { field: "user" } }
})
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  @QueryPermissions("Anyone")
  public id: string;

  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions(["Anyone", { name: "Owner", params: { field: "user" } }])
  public title: string;

  @ManyToOne((type) => User)
  @QueryPermissions(["Anyone"])
  public user: User;

  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions(["Anyone", { name: "Owner", params: { field: "user" } }])
  public updateTime: string;
}
