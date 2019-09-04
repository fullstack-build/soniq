-- file_validate function sets the entityId of a file if not already set or deletedAt
CREATE OR REPLACE FUNCTION _meta.file_invalidate(i_file_id uuid, i_entity_id uuid) RETURNS void AS $$
DECLARE
    v_owner_user_id uuid;
    v_deletedAt TEXT;
    v_entity_id uuid;
    v_query TEXT;
BEGIN
    v_query := $tok$SELECT "entityId" FROM _meta."Files" WHERE id = %L$tok$;
    EXECUTE format(v_query, i_file_id) INTO v_entity_id;

    if v_entity_id != i_entity_id THEN
        RAISE EXCEPTION 'You cannot remove a file from an entity where it is not bound to.';
    END IF;

    v_query := $tok$UPDATE _meta."Files" SET "deletedAt"=now() WHERE id = %L$tok$;
    EXECUTE format(v_query, i_file_id);
END;
$$ LANGUAGE plpgsql;