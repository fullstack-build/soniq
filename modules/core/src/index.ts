import "reflect-metadata";
// DI
import {
  Service,
  Container,
  ContainerInstance,
  Inject,
  InjectMany,
} from "typedi";
export { Service, Container, ContainerInstance, Inject, InjectMany };
import { BootLoader } from "./BootLoader

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

@Service("@fullstack-one/core")
export class Core {
  private readonly bootLoader: BootLoader = new BootLoader();

  private constructor() {}

  // draw CLI art
  private drawCliArt(): void {
    process.stdout.write(
      `  ┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n  ├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤\n  └  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n`
    );
    //process.stdout.write(`${JSON.stringify(this.ENVIRONMENT, null, 2)}\n`);
    process.stdout.write("____________________________________\n");
  }

  public async boot() {
    await this.bootLoader.boot();
    this.drawCliArt();
    return;
  }
}
