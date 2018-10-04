export declare class BootLoader {
  private IS_BOOTING;
  private HAS_BOOTED;
  private bootFunctions;
  private bootReadyFunctions;
  isBooting(): boolean;
  hasBooted(): boolean;
  addBootFunction(fn: any): void;
  onBootReady(fn: any): any;
  getReadyPromise(): Promise<{}>;
  boot(): Promise<void>;
}
