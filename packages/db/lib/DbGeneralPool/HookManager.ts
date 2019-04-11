import { Service } from "@fullstack-one/di";
import { THookFunction, TErrorHookFunction } from "../types";

@Service()
export class HookManager {
  private poolCreatedHooks: THookFunction[] = [];

  private poolInitialConnectStartHooks: THookFunction[] = [];
  private poolInitialConnectSuccessHooks: THookFunction[] = [];
  private poolInitialConnectReleaseHooks: THookFunction[] = [];
  private poolInitialConnectErrorHooks: TErrorHookFunction[] = [];

  private poolEndStartHooks: THookFunction[] = [];
  private poolEndSuccessHooks: THookFunction[] = [];
  private poolEndErrorHooks: TErrorHookFunction[] = [];

  public addPoolCreatedHook(hookFunction: THookFunction): void {
    this.poolCreatedHooks.push(hookFunction);
  }

  public addPoolInitialConnectStartHook(hookFunction: THookFunction): void {
    this.poolInitialConnectStartHooks.push(hookFunction);
  }
  public addPoolInitialConnectSuccessHook(hookFunction: THookFunction): void {
    this.poolInitialConnectSuccessHooks.push(hookFunction);
  }
  public addPoolInitialConnectReleaseHook(hookFunction: THookFunction): void {
    this.poolInitialConnectReleaseHooks.push(hookFunction);
  }
  public addPoolInitialConnectErrorHook(hookFunction: TErrorHookFunction): void {
    this.poolInitialConnectErrorHooks.push(hookFunction);
  }

  public addPoolEndStartHook(hookFunction: THookFunction): void {
    this.poolEndStartHooks.push(hookFunction);
  }
  public addPoolEndSuccessHook(hookFunction: THookFunction): void {
    this.poolEndSuccessHooks.push(hookFunction);
  }
  public addPoolEndErrorHook(hookFunction: TErrorHookFunction): void {
    this.poolEndErrorHooks.push(hookFunction);
  }

  public async executePoolCreatedHooks(applicationName: string): Promise<void> {
    await Promise.all(this.poolCreatedHooks.map((hook) => hook(applicationName)));
  }

  public async executePoolInitialConnectStartHooks(applicationName: string): Promise<void> {
    await Promise.all(this.poolInitialConnectStartHooks.map((hook) => hook(applicationName)));
  }
  public async executePoolInitialConnectSuccessHooks(applicationName: string): Promise<void> {
    await Promise.all(this.poolInitialConnectSuccessHooks.map((hook) => hook(applicationName)));
  }
  public async executePoolInitialConnectReleaseHooks(applicationName: string): Promise<void> {
    await Promise.all(this.poolInitialConnectReleaseHooks.map((hook) => hook(applicationName)));
  }
  public async executePoolInitialConnectErrorHooks(applicationName: string, err: any): Promise<void> {
    await Promise.all(this.poolInitialConnectErrorHooks.map((hook) => hook(applicationName, err)));
  }

  public async executePoolEndStartHooks(applicationName: string): Promise<void> {
    await Promise.all(this.poolEndStartHooks.map((hook) => hook(applicationName)));
  }
  public async executePoolEndSuccessHooks(applicationName: string): Promise<void> {
    await Promise.all(this.poolEndSuccessHooks.map((hook) => hook(applicationName)));
  }
  public async executePoolEndErrorHooks(applicationName: string, err: any): Promise<void> {
    await Promise.all(this.poolEndErrorHooks.map((hook) => hook(applicationName, err)));
  }
}
