import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne } from "@fullstack-one/db";
import { MutationPermissions, QueryPermissions } from "@fullstack-one/schema-builder";
import User from "./User";

@Entity()
@MutationPermissions({
  createViews: {
    me: {
      fields: ["prinzipal", "agent"],
      expressions: ["Anyone"]
    }
  }
})
export default class Represent extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne((type) => User, "prinzipalRepresent")
  @QueryPermissions("Anyone")
  public prinzipal: User;

  @ManyToOne((type) => User, "agentRepresent")
  @QueryPermissions("Anyone")
  public agent: User;
}
