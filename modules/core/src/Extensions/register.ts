import { TRegisterFunction } from "./interfaces";

let soniqExtensionRegisterFunction: TRegisterFunction | null = null;

export function registerExtension(register: TRegisterFunction): void {
  if (soniqExtensionRegisterFunction == null) {
    soniqExtensionRegisterFunction = register;
  } else {
    throw new Error("The extension-register-function cannot be set twice.");
  }
}

export function prepareRegister(): void {
  soniqExtensionRegisterFunction = null;
}

export function getExtensionRegisterFunction(): TRegisterFunction | null {
  return soniqExtensionRegisterFunction;
}
