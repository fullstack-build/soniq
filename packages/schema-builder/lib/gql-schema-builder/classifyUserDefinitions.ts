import findDirectiveIndex from './utils/findDirectiveIndex';

export default (source) => {

  const tables = {};
  const otherDefinitions = [];

  Object.values(source.definitions).forEach((node: any) => {

    if (node.kind === 'ObjectTypeDefinition' && findDirectiveIndex(node, 'table') !== -1) {
      tables[node.name.value] = node;

    } else {
      otherDefinitions.push(node);
    }
  });

  // console.log({ tables, otherDefinitions });
  return { tables, otherDefinitions };

};
