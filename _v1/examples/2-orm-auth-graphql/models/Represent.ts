import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne } from "@fullstack-one/db";
import { MutationPermissions, QueryPermissions } from "@fullstack-one/schema-builder";
import { anyone } from "../expressions";
import User from "./User";

@Entity()
@MutationPermissions({
  createViews: {
    me: {
      fields: ["prinzipal", "agent"],
      expressions: [anyone()]
    }
  }
})
export default class Represent extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne((type) => User, "prinzipalRepresent")
  @QueryPermissions(anyone())
  public prinzipal: User;

  @ManyToOne((type) => User, "agentRepresent")
  @QueryPermissions(anyone())
  public agent: User;
}
