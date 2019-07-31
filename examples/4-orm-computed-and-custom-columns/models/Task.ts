import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import { Computed, QueryPermissions } from "@fullstack-one/schema-builder";
import { anyone, getTrue, getNumber, myId } from "../expressions";

@Entity({ schema: "public" })
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: "This is a very important id column." })
  @QueryPermissions(anyone())
  public id: number;
  
  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions(anyone())
  public title: string;

  @Computed({ ...getTrue(), gqlType: "Boolean" })
  @QueryPermissions(anyone())
  public solved: () => Promise<boolean>;
  
  @Computed({ ...getNumber(), gqlType: "Int" })
  @QueryPermissions(anyone())
  public time: () => Promise<number>;
  
  @Computed({ ...myId(), gqlType: "ID" })
  @QueryPermissions(anyone())
  public computedId: () => Promise<number>;
}
