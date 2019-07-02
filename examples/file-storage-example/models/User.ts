import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import { Files } from "@fullstack-one/file-storage";
import { QueryPermissions, MutationPermissions } from "@fullstack-one/schema-builder";

@Entity({ schema: "public" })
@MutationPermissions({
  createViews: {
    me: {
      fields: ["name", "images"],
      expressions: "Anyone",
      returnOnlyId: true
    }
  },
  updateViews: {
    me: {
      fields: ["id", "images"],
      expressions: { name: "Owner", params: { field: "id" } },
      returnOnlyId: true
    }
  }
})
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  public name: string;

  @Column()
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  @Files(["DEFAULT", "PROFILE_IMAGE"])
  images?: string[]
}
