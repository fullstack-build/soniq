import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, OneToOneJoinColumn, OneToMany } from "@fullstack-one/db";
import { MutationPermissions, QueryPermissions } from "@fullstack-one/schema-builder";
import { anyone } from "../expressions";
import Photo from "./Photo";
import Task from "./Task";
import Represent from "./Represent";

export enum Size {
  small,
  medium,
  large,
  superLarge
}

export enum Gender {
  male,
  female,
  diverse
}

@Entity()
@MutationPermissions<User>({
  createViews: {
    me: {
      fields: ["firstname", "lastname"],
      expressions: anyone(),
      returnOnlyId: true
    }
  }
})
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @QueryPermissions(anyone())
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  public firstname: string;

  @Column({ gqlType: "String", type: "character varying" })
  public lastname: string;

  @OneToOneJoinColumn((type) => Photo, { nullable: true })
  public photo?: Photo;

  @OneToMany((type) => Task, "user", { nullable: true })
  public tasks?: Task[];

  @Column({ enum: Size, enumName: "Size", nullable: true })
  public size?: Size;

  @Column({ enum: Gender, enumName: "Gender", gqlType: "String", type: "integer", nullable: true })
  public gender?: Gender;

  @OneToMany((type) => Represent, "prinzipal", { nullable: true })
  public prinzipalRepresent?: Represent;

  @OneToMany((type) => Represent, "agent", { nullable: true })
  public agentRepresent?: Represent;
}
