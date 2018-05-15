-- file_validate function sets the entityId of a file if not already set or deletedAt
CREATE OR REPLACE FUNCTION _meta.file_validate(i_file_name TEXT, i_entity_id uuid, i_types TEXT[]) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_owner_user_id uuid;
    v_deletedAt TIMESTAMP;
    v_verifiedAt TIMESTAMP;
    v_entity_id uuid;
    v_query TEXT;
    v_type TEXT;
    v_types TEXT[];
    v_type_position INT;
    v_file_elements TEXT[];
    v_file_id uuid;
    v_file_extension TEXT;
    v_extension TEXT;
    v_id uuid;
BEGIN
    v_user_id := _meta.current_user_id();

    v_file_elements = regexp_split_to_array(i_file_name, '\.');

    if array_length(v_file_elements, 1) < 2 THEN
        RAISE EXCEPTION 'Invalid fileName.';
    END IF;

    v_file_id := v_file_elements[1];
    v_file_extension := v_file_elements[2];

    v_query := $tok$SELECT "id", "ownerUserId", "deletedAt", "entityId", "verifiedAt", "type", "extension" FROM _meta."Files" WHERE id = %L$tok$;
    EXECUTE format(v_query, v_file_id) INTO v_id, v_owner_user_id, v_deletedAt, v_entity_id, v_verifiedAt, v_type, v_extension;



    RAISE NOTICE 'FILE ID % => %', v_id, v_owner_user_id;

    if v_id IS NULL THEN
        RAISE EXCEPTION 'File not found!';
    END IF;

    if v_extension != v_file_extension THEN
        RAISE EXCEPTION 'Invalid file extension.';
    END IF;

    if v_owner_user_id != v_user_id THEN
        RAISE EXCEPTION 'You are not the owner of the file you are trying to add.';
    END IF;

    if v_verifiedAt IS NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has not been verified yet.';
    END IF;

    if v_deletedAt IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has been deleted.';
    END IF;

    if v_entity_id IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to add has already been added to an entity.';
    END IF;

    -- Check if fileType is a valid type for the current entity

    v_type_position := array_position(i_types, v_type);

    -- If the position is null, the type is not in the list and thereby not allowed.
    IF v_type_position IS NULL THEN
        RAISE EXCEPTION 'The file-type you are trying to add is not.';
    END IF;
    

    v_query := $tok$UPDATE _meta."Files" SET "entityId"=%L WHERE id = %L$tok$;
    EXECUTE format(v_query, i_entity_id, v_id);
END;
$$ LANGUAGE plpgsql;