export default function calculateMaxDepth(costTree: any): number {
  let depth = 0;

  if (costTree.__meta.type === "aggregation") {
    depth += 1;
  }

  Object.keys(costTree).forEach((key) => {
    if (key !== "__meta") {
      depth += calculateMaxDepth(costTree[key]);
    }
  });

  return depth;
}
