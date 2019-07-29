import { AfterLoad, BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import { Computed, QueryPermissions } from "@fullstack-one/schema-builder";

@Entity({ schema: "public" })
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: "This is a very important id column." })
  @QueryPermissions("Anyone")
  public id: number;
  
  @Column({ gqlType: "String", type: "character varying" })
  @QueryPermissions("Anyone")
  public title: string;
  
  // TODO: This AfterLoad function should be created when @Computed is used
  @AfterLoad()
  private loadComputed() {
    if (this.solved == null) this.solved = () => Promise.resolve(true);
    if (this.time == null) this.time = () => Promise.resolve(10);
  }

  @Computed({ expression: "GetTrue", gqlType: "Boolean" })
  @QueryPermissions("Anyone")
  public solved: () => Promise<boolean>;
  
  @Computed({ expression: "GetNumber", gqlType: "Int" })
  @QueryPermissions("Anyone")
  public time: () => Promise<number>;
}
