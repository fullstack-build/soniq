-- file_create function returns the id of a new file with a certain extension
CREATE OR REPLACE FUNCTION _file_storage.file_create_system(i_extension TEXT, i_type TEXT) RETURNS uuid AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_id uuid;
    v_file_id uuid;
    v_file_count BIGINT;
    c_file_count_max BIGINT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    EXECUTE format('INSERT INTO "_file_storage"."Files"("extension", "type") VALUES(%L, %L) RETURNING id', i_extension, i_type) INTO v_file_id;

    RETURN v_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;