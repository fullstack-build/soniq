import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import { Files } from "@fullstack-one/file-storage";
import { QueryPermissions, MutationPermissions } from "@fullstack-one/schema-builder";
import { anyone, owner } from "../expressions/basic";

@Entity({ schema: "public" })
@MutationPermissions({
  createViews: {
    me: {
      fields: ["name", "images"],
      expressions: anyone(),
      returnOnlyId: true
    }
  },
  updateViews: {
    me: {
      fields: ["id", "images"],
      expressions: owner({ field: "id" }),
      returnOnlyId: true
    }
  }
})
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @QueryPermissions(owner({ field: "id" }))
  public id: number;

  @Column({ gqlType: "String", type: "character varying", unique: true })
  @QueryPermissions(owner({ field: "id" }))
  public name: string;

  @Column()
  @QueryPermissions(owner({ field: "id" }))
  @Files(["DEFAULT", "PROFILE_IMAGE"])
  public images?: string[];
}
