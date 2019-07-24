import { BaseEntity, Entity, Column, Check, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "@fullstack-one/db";

@Entity({ deletable: true, updatable: true })
@Check(`_meta.validate('isBoolean', solved, '')`)
export default class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @CreateDateColumn()
  public readonly createdAt!: string;

  @UpdateDateColumn()
  public readonly updatedAt!: string;

  @Column({ gqlType: "String", type: "character varying" })
  public title: string;

  @Column({ gqlType: "String", type: "character varying" })
  public solved: string;
}
