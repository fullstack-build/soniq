import { ReturnIdHandler } from "../../ReturnIdHandler";

export default function parseValue(value: any, returnIdHandler: ReturnIdHandler): string {
  if (value != null && typeof value === "object") return JSON.stringify(value);
  return returnIdHandler.getReturnId(`${value}`);
}
