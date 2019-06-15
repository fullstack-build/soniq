import "reflect-metadata";
import { Entity, PrimaryColumn, UpdateDateColumn, BaseEntity } from "typeorm";

@Entity({ schema: "_meta" })
export default class NodeJsClient extends BaseEntity {
  @PrimaryColumn({ type: "character varying", length: 6, unique: true })
  public nodeId: string;

  @UpdateDateColumn()
  public lastOnline: string;
}
