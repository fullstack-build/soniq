import { ICostTree } from "./types";

export default function calculateMaxDepth({ type, subtrees }: ICostTree): number {
  const subDepth = subtrees.map(calculateMaxDepth).reduce((depth1, depth2) => depth1 + depth2, 0);
  const depthAddition = type === "aggregation" ? 1 : 0;
  return subDepth + depthAddition;
}
