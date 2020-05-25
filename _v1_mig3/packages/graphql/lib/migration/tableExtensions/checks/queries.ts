export const GET_CHECKS = `
SELECT pgc.conname AS constraint_name,
       ccu.table_schema AS table_schema,
       ccu.table_name,
       ccu.column_name,
       pgc.consrc AS definition
FROM pg_constraint pgc
JOIN pg_namespace nsp ON nsp.oid = pgc.connamespace
JOIN pg_class cls ON pgc.conrelid = cls.oid
LEFT JOIN information_schema.constraint_column_usage ccu
          ON pgc.conname = ccu.constraint_name
          AND nsp.nspname = ccu.constraint_schema
WHERE contype ='c' AND $1 @> ARRAY[ccu.table_schema::text];
`;
