import { parseDirectiveArguments } from "./parseDirectiveArguments";
import { DirectiveNode } from "graphql";

interface IDirectivesObject {
  [directiveName: string]: any;
}

export function parseDirectives(directiveNodes: ReadonlyArray<DirectiveNode>): IDirectivesObject {
  const directivesObject: IDirectivesObject = {};

  directiveNodes.forEach((directive) => {
    directivesObject[directive.name.value] = parseDirectiveArguments(directive);
  });

  return directivesObject;
}
