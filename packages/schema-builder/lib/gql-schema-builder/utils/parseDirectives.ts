import { DirectiveNode } from "graphql";
import { IDirectivesObject } from "./interfaces";
import { parseDirectiveArguments } from "./parseDirectiveArguments";

export function parseDirectives(directiveNodes: ReadonlyArray<DirectiveNode>): IDirectivesObject {
  const directivesObject: IDirectivesObject = {};

  directiveNodes.forEach((directive) => {
    directivesObject[directive.name.value] = parseDirectiveArguments(directive);
  });

  return directivesObject;
}
