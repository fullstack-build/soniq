import { BootLoader } from "../../lib/index";
import IStateSpy from "../helpers/IStateSpy";

export class AfterBootMock {
  private readonly bootLoader: BootLoader;
  private readonly stateSpy: IStateSpy;
  public property: string = "old property";

  constructor(bootLoader: BootLoader, stateSpy: IStateSpy) {
    this.bootLoader = bootLoader;
    this.stateSpy = stateSpy;
    bootLoader.onBootReady(this.constructor.name, this.afterboot.bind(this));
  }

  private afterboot(): void {
    this.stateSpy.bootState = this.bootLoader.getBootState();
    this.property = "new property";
  }
}
