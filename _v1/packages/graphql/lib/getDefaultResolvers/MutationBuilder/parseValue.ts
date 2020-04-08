import { ReturnIdHandler } from "../../ReturnIdHandler";

export default function parseValue(value: any, returnIdHandler: ReturnIdHandler): string | null {
  if (value != null && typeof value === "object") {
    return JSON.stringify(value);
  }
  if (value == null) {
    return null;
  }
  return returnIdHandler.getReturnId(`${value}`);
}
