
import getArgumentByName from './getArgumentByName';
import findDirectiveIndex from './findDirectiveIndex';
import parseObjectArgument from './parseObjectArgument';

export default (classification) => {
  const customQueries = [];
  const customMutations = [];

  Object.values(classification.otherDefinitions).forEach((node) => {
    if (node.kind === 'TypeExtensionDefinition') {
      const type = node.definition.name.value;
      Object.values(node.definition.fields).forEach((field) => {
        const fieldName = field.name.value;
        const customDirectiveIndex = findDirectiveIndex(field, 'custom');

        if (customDirectiveIndex > -1) {
          const customDirective = field.directives[customDirectiveIndex];

          const resolverName = getArgumentByName(customDirective, 'resolver').value.value;
          const paramsNode = getArgumentByName(customDirective, 'params');
          let params = {};

          if (paramsNode != null) {
            params = parseObjectArgument(paramsNode);
          }

          if (type === 'Query') {
            customQueries.push({
              name: fieldName,
              type,
              resolver: resolverName,
              params
            });
          }

          if (type === 'Mutation') {
            customMutations.push({
              name: fieldName,
              type,
              resolver: resolverName,
              params
            });
          }
        }
      });
    }
  });

  return {
    customQueries,
    customMutations
  };
};
