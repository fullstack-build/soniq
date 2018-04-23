-- file_validate function sets the entityId of a file if not already set or deleted
CREATE OR REPLACE FUNCTION _meta.file_validate(i_file_id uuid, i_entity_id uuid) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_owner_user_id uuid;
    v_deleted TEXT;
    v_entity_id uuid;
    v_query TEXT;
BEGIN
    v_user_id := _meta.current_user_id();

    v_query := $tok$SELECT "entityId" FROM _meta."Files" WHERE id = %L$tok$;
    EXECUTE format(v_query, i_file_id) INTO v_entity_id;

    if v_entity_id != i_entity_id THEN
        RAISE EXCEPTION 'You are not the owner of the file you are trying to add!';
    END IF;

    v_query := $tok$UPDATE _meta."Files" SET "deleted"=now() WHERE id = %L$tok$;
    EXECUTE format(v_query, i_entity_id, i_file_id);
END;
$$ LANGUAGE plpgsql;