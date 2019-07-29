import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@fullstack-one/db";

@Entity({ schema: "public" })
export default class Photo extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: "This is a very important id column." })
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  public name: string;
}
