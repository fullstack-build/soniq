import { parseDirectiveArguments } from "./parseDirectiveArguments";
import { DirectiveNode } from "graphql";

export function parseDirectives(directives: DirectiveNode[]) {
  const directivesObject: any = {};

  directives.forEach((directive) => {
    directivesObject[directive.name.value] = parseDirectiveArguments(directive);
  });

  return directivesObject;
}
