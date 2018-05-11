
import { getArgumentByName, findDirectiveIndex, parseObjectArgument, parseDirectiveArguments } from './utils';

export default (classification) => {
  const customQueries = [];
  const customMutations = [];

  Object.values(classification.otherDefinitions).forEach((node: any) => {
    if (node.kind === 'ObjectTypeExtension') {
      const type = node.name.value;
      Object.values(node.fields).forEach((field: any) => {
        const fieldName = field.name.value;
        const customDirectiveIndex = findDirectiveIndex(field, 'custom');

        if (customDirectiveIndex > -1) {
          const customDirective = field.directives[customDirectiveIndex];

          const directiveArguments: any = parseDirectiveArguments(customDirective);

          const resolverName = directiveArguments.resolver;
          const params = directiveArguments.params || {};

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
