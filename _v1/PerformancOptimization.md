
- Use a `TRUE` expression with `excludeFromPermissionExpressions = true` for PK's and FK's in all views.
- Move often used queries into a computed column boolean expression, and query against that in gql.
- Remove security_barrier from performance-critical views. (especially if you do have complex gql where conditions against huge tables)
- If you only need a list of id's of a foreign 1:n entity, create a computed column which aggregates a list. (That saves one subquery (join))
- Try to avoid permissions, which depend on a column in the table.