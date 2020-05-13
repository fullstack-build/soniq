export const GET_INDEXES: string = `
SELECT
	schemaname "table_schema",
	tablename "table_name",
  indexname "index_name",
  indexdef "index_def"
FROM
  pg_indexes
WHERE
  $1 @> ARRAY[schemaname::text];
`;
