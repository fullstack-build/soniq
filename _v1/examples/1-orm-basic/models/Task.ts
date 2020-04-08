import { BaseEntity, Entity, Column, Check, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "@fullstack-one/db";

@Entity()
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @CreateDateColumn()
  public readonly createdAt!: string;

  @UpdateDateColumn()
  public readonly updatedAt!: string;

  @Column({ gqlType: "String", type: "character varying", nullable: false })
  public title!: string;

  @Column({ gqlType: "String", type: "character varying", nullable: true })
  public solved?: string;
}
