
import { parseDirectiveArguments } from './parseDirectiveArguments';

export function parseDirectives(directives) {
  const directivesObject: any =  {};

  directives.forEach((directive) => {
    directivesObject[directive.name.value] = parseDirectiveArguments(directive);
  });

  return directivesObject;
}
