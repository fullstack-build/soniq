export const INTROSPECTION_QUERY: string = `
SELECT 
	*, 
	(SELECT pgd.description
	  FROM pg_catalog.pg_statio_all_tables AS st
	    INNER JOIN pg_catalog.pg_description pgd 
	      ON (pgd.objoid=st.relid)
	    INNER JOIN information_schema.columns c
	      ON (pgd.objsubid=c.ordinal_position AND c.table_schema=st.schemaname AND c.table_name=st.relname) 
	    WHERE c.table_schema = ic.table_schema AND c.table_name = ic.table_name AND c.column_name = ic.column_name
	) "comment"
	FROM information_schema.columns ic 
WHERE $1 @> ARRAY[table_schema::text];
`;
