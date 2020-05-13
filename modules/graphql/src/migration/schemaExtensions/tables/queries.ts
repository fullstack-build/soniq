export const GET_TABLES: string = `
SELECT 
	table_schema "schema", 
	table_name "name", 
	obj_description(('"' || table_schema || '"."' || table_name || '"')::regclass) "comment"
FROM information_schema.tables 
WHERE table_type = 'BASE TABLE' AND $1 @> ARRAY[table_schema::text];
`;
