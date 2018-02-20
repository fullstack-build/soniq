export default (node, directiveName) => {
  return Object.entries(node.directives).findIndex((element: any) => {
    const directive = element[1];
    return (directive.name.value === directiveName);
  });
};
