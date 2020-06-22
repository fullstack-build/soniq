import { TRegisterFunction } from "./interfaces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let soniqExtensionContext: any;

export function registerExtension(register: TRegisterFunction): void {
  soniqExtensionContext.registerNewExtension = register;
}
