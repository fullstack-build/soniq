import "reflect-metadata";
import * as ORM from "@fullstack-one/db";

@ORM.Entity("Photo")
export class Photo extends ORM.BaseEntity {
  @ORM.PrimaryGeneratedColumn()
  public id: number;

  @ORM.Column()
  public name: string;

  @ORM.Column()
  public description: string;

  @ORM.Column()
  public filename: string;

  @ORM.Column()
  public views: number;

  @ORM.Column()
  public isPublished: boolean;
}
