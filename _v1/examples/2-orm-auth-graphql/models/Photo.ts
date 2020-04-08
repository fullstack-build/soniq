import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@fullstack-one/db";
import { MutationPermissions, QueryPermissions } from "@fullstack-one/schema-builder";
import { anyone } from "../expressions";

@Entity({ schema: "public", auditing: true })
@MutationPermissions({
  createViews: {
    me: {
      fields: ["name"],
      expressions: [anyone()]
    }
  }
})
export default class Photo extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: "This is a very important id column." })
  @QueryPermissions(anyone())
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions(anyone())
  public name: string;
}
