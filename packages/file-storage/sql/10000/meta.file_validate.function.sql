-- file_validate function sets the entityId of a file if not already set or deletedAt
CREATE OR REPLACE FUNCTION _meta.file_validate(i_file_id uuid, i_entity_id uuid) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_owner_user_id uuid;
    v_deletedAt TIMESTAMP;
    v_verifiedAt TIMESTAMP;
    v_entity_id uuid;
    v_query TEXT;
BEGIN
    v_user_id := _meta.current_user_id();

    v_query := $tok$SELECT "ownerUserId", "deletedAt", "entityId", "verifiedAt" FROM _meta."Files" WHERE id = %L$tok$;
    EXECUTE format(v_query, i_file_id) INTO v_owner_user_id, v_deletedAt, v_entity_id, v_verifiedAt;

    if v_owner_user_id != v_user_id THEN
        RAISE EXCEPTION 'You are not the owner of the file you are trying to add!';
    END IF;

    if v_verifiedAt IS NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has not been verified yet!';
    END IF;

    if v_deletedAt IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has been deleted!';
    END IF;

    if v_entity_id IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has already been added to an entity!';
    END IF;
    

    v_query := $tok$UPDATE _meta."Files" SET "entityId"=%L WHERE id = %L$tok$;
    EXECUTE format(v_query, i_entity_id, i_file_id);
END;
$$ LANGUAGE plpgsql;