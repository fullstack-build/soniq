import { Service } from "@fullstack-one/di";
import { THookFunction, TErrorHookFunction } from "../types";

@Service()
export class HookManager {
  private clientCreatedHooks: THookFunction[] = [];

  private clientConnectStartHooks: THookFunction[] = [];
  private clientConnectSuccessHooks: THookFunction[] = [];
  private clientConnectErrorHooks: TErrorHookFunction[] = [];

  private clientEndStartHooks: THookFunction[] = [];
  private clientEndSuccessHooks: THookFunction[] = [];
  private clientEndErrorHooks: TErrorHookFunction[] = [];

  public addClientCreatedHook(hookFunction: THookFunction): void {
    this.clientCreatedHooks.push(hookFunction);
  }

  public addClientConnectStartHook(hookFunction: THookFunction): void {
    this.clientConnectStartHooks.push(hookFunction);
  }
  public addClientConnectSuccessHook(hookFunction: THookFunction): void {
    this.clientConnectSuccessHooks.push(hookFunction);
  }
  public addClientConnectErrorHook(hookFunction: TErrorHookFunction): void {
    this.clientConnectErrorHooks.push(hookFunction);
  }

  public addClientEndStartHook(hookFunction: THookFunction): void {
    this.clientEndStartHooks.push(hookFunction);
  }
  public addClientEndSuccessHook(hookFunction: THookFunction): void {
    this.clientEndSuccessHooks.push(hookFunction);
  }
  public addClientEndErrorHook(hookFunction: TErrorHookFunction): void {
    this.clientEndErrorHooks.push(hookFunction);
  }

  public async executeClientCreatedHooks(applicationName: string): Promise<void> {
    await Promise.all(this.clientCreatedHooks.map((hook) => hook(applicationName)));
  }

  public async executeClientConnectStartHooks(applicationName: string): Promise<void> {
    await Promise.all(this.clientConnectStartHooks.map((hook) => hook(applicationName)));
  }
  public async executeClientConnectSuccessHooks(applicationName: string): Promise<void> {
    await Promise.all(this.clientConnectSuccessHooks.map((hook) => hook(applicationName)));
  }
  public async executeClientConnectErrorHooks(applicationName: string, err: any): Promise<void> {
    await Promise.all(this.clientConnectErrorHooks.map((hook) => hook(applicationName, err)));
  }

  public async executeClientEndStartHooks(applicationName: string): Promise<void> {
    await Promise.all(this.clientEndStartHooks.map((hook) => hook(applicationName)));
  }
  public async executeClientEndSuccessHooks(applicationName: string): Promise<void> {
    await Promise.all(this.clientEndSuccessHooks.map((hook) => hook(applicationName)));
  }
  public async executeClientEndErrorHooks(applicationName: string, err: any): Promise<void> {
    await Promise.all(this.clientEndErrorHooks.map((hook) => hook(applicationName, err)));
  }
}
