import { BaseEntity, createColumnDecorator, createColumnDecoratorFactory, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import { files } from "@fullstack-one/file-storage";
import { QueryPermissions, MutationPermissions } from "@fullstack-one/schema-builder";

const myDecorator = createColumnDecorator({ directive: "@myDirective" });
const myDecoratorFactory = createColumnDecoratorFactory<{ max: number }>({ getDirective: ({ max }) => `@myParamDirective(max: ${max})` });

@Entity({ schema: "public" })
@MutationPermissions({
  createViews: {
    me: {
      fields: ["name"],
      expressions: "Anyone",
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

  @Column({ type: "jsonb", gqlType: "[BucketFile]", nullable: true })
  @QueryPermissions({ name: "Owner", params: { field: "id" } })
  @files(["DEFAULT"])
  images?: string[]
}
