import { BootLoader } from "../../lib/index";
import IStateSpy from "../IStateSpy";

export class BootMock {
  private readonly bootLoader: BootLoader;
  private readonly stateSpy: IStateSpy;
  public property: string = "old property";

  constructor(bootLoader: BootLoader, stateSpy: IStateSpy) {
    this.bootLoader = bootLoader;
    this.stateSpy = stateSpy;
    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private boot(): void {
    this.stateSpy.bootState = this.bootLoader.getBootState();
    this.property = "new property";
  }
}
