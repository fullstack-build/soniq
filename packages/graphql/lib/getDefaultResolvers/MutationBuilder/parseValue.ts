export default function parseValue(value: any): string {
  if (value != null && typeof value === "object") return JSON.stringify(value);
  return `${value}`;
}
