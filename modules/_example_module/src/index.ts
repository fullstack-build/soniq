import { DI } from "soniq";

@DI.injectable()
export class Server {
  public constructor() {
    console.log("I am an example modules!");
  }
}
