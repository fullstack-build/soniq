-- file_create function returns the id of a new file with a certain extension
CREATE OR REPLACE FUNCTION _meta.file_create(i_extension TEXT, i_type TEXT) RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_file_id uuid;
    v_file_count BIGINT;
    c_file_count_max BIGINT;
BEGIN
    SELECT value INTO c_file_count_max FROM _meta."FileSettings" WHERE key = 'max_temp_files_per_user';
    v_user_id := _auth.current_user_id();

    EXECUTE format('SELECT count(*) FROM _meta."Files" WHERE "ownerUserId" = %L AND "entityId" IS NULL;', v_user_id) INTO v_file_count;

    IF v_file_count >= c_file_count_max THEN
      RAISE EXCEPTION 'You reached the limit of uploadable files.';
    END IF;
    
    EXECUTE format('INSERT INTO "_meta"."Files"("extension", "type", "ownerUserId") VALUES(%L, %L, %L) RETURNING id', i_extension, i_type, v_user_id) INTO v_file_id;

    RETURN v_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;