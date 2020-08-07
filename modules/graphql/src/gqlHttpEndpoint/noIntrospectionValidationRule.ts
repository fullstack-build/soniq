import { GraphQLError, ASTVisitor, ValidationContext, FieldNode } from "graphql";

export function NoIntrospection(context: ValidationContext): ASTVisitor {
  return {
    Field(node: FieldNode) {
      if (node.name.value === "__schema" || node.name.value === "__type") {
        context.reportError(
          new GraphQLError("GraphQL introspection is not allowed, but the query contained __schema or __type", [node])
        );
      }
    },
  };
}
