import { Service } from "soniq";

@Service()
export class Server {
  public constructor() {
    console.log("I am an example modules!");
  }
}
