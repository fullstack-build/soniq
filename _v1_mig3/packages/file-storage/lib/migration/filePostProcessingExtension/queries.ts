export const GET_COLUMNS = `SELECT * FROM _file_storage."Columns" fc WHERE $1 @> ARRAY[fc."schemaName"::text];`;
export const GET_TRIGGERS = `SELECT * FROM information_schema.triggers WHERE $1 @> ARRAY[event_object_schema::text] AND trigger_name LIKE 'fileStorage_trigger_%';;`;
