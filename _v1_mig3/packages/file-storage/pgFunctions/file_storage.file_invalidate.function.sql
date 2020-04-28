-- file_validate function sets the entityId of a file if not already set or deletedAt
CREATE OR REPLACE FUNCTION _file_storage.file_invalidate(i_file_name TEXT, i_entity_id uuid) RETURNS void AS $$
DECLARE
    v_owner_user_id uuid;
    v_deletedAt TEXT;
    v_entity_id uuid;
    v_query TEXT;
    v_file_elements TEXT[];
    v_file_name TEXT;
    v_file_name_elements TEXT[];
    v_file_id uuid;
    v_file_type TEXT;
    v_file_extension TEXT;
BEGIN
    v_file_elements = regexp_split_to_array(i_file_name, '\.');

    if array_length(v_file_elements, 1) < 2 THEN
        RAISE EXCEPTION 'Invalid fileName.';
    END IF;

    v_file_name := v_file_elements[1];
    v_file_extension := v_file_elements[2];

    v_file_name_elements = regexp_split_to_array(v_file_name, '-');

    if array_length(v_file_name_elements, 1) != 6 THEN
        RAISE EXCEPTION 'Invalid fileName.';
    END IF;

    v_file_id := v_file_name_elements[1] || v_file_name_elements[2] || v_file_name_elements[3] || v_file_name_elements[4] || v_file_name_elements[5];
    v_file_type := v_file_name_elements[6];

    v_query := $tok$SELECT "entityId" FROM _file_storage."Files" WHERE id = %L$tok$;
    EXECUTE format(v_query, v_file_id) INTO v_entity_id;

    if v_entity_id != i_entity_id THEN
        RAISE EXCEPTION 'You cannot remove a file from an entity where it is not bound to.';
    END IF;

    v_query := $tok$UPDATE _file_storage."Files" SET "deletedAt"=now() WHERE id = %L$tok$;
    EXECUTE format(v_query, v_file_id);
END;
$$ LANGUAGE plpgsql;