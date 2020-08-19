import { DI } from "soniq";

@DI.injectable()
export class Example {
  public constructor() {
    console.log("I am an example modules!");
  }
}
