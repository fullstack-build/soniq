export default (node, directiveName) => {
  const directives = [];
  Object.values(node.directive).forEach((directive) => {
    if (directive.name.value === directiveName) {
      directives.push(directive);
    }
  });
  return directives;
};
