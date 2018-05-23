export default (node, argumentName) => {
  for (const i in node.arguments || []) {
    if (node.arguments[i].name.value === argumentName) {
      return node.arguments[i];
    }
  }
  return null;
};
