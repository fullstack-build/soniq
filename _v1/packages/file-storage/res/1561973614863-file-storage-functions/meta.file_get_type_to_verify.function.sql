-- file_create function returns the id of a new file with a certain extension
CREATE OR REPLACE FUNCTION _meta.file_get_type_to_verify(i_file_id uuid) RETURNS TEXT AS $$
DECLARE
    v_user_id uuid;
    v_owner_user_id uuid;
    v_deletedAt TIMESTAMP;
    v_verifiedAt TIMESTAMP;
    v_type TEXT;
    v_query TEXT;
BEGIN
    v_user_id := _auth.current_user_id_or_null();

    v_query := $tok$SELECT "ownerUserId", "deletedAt", "verifiedAt", "type" FROM _meta."Files" WHERE id = %L$tok$;
    EXECUTE format(v_query, i_file_id) INTO v_owner_user_id, v_deletedAt, v_verifiedAt, v_type;

    if v_owner_user_id IS NULL AND v_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'You cannot verify a system file.';
    END IF;

    if v_owner_user_id IS NOT NULL AND v_user_id IS NULL THEN
        RAISE EXCEPTION 'You cannot verify a user file.';
    END IF;

    if v_owner_user_id != v_user_id THEN
        RAISE EXCEPTION 'You are not the owner of the file you are trying to verify!';
    END IF;

    if v_deletedAt IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to verify has been deleted!';
    END IF;

    if v_verifiedAt IS NOT NULL THEN
        RAISE EXCEPTION 'The file you are trying to verify has already been verified!';
    END IF;

    RETURN v_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;