import * as typeorm from "typeorm";

export class BaseEntity extends typeorm.BaseEntity {
  constructor() {
    super();
  }
}
