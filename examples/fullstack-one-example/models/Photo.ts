import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from "@fullstack-one/db";

@Entity("Photo")
export class Photo extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column()
  public description: string;

  @Column()
  public filename: string;

  @Column()
  public views: number;

  @Column()
  public isPublished: boolean;
}
