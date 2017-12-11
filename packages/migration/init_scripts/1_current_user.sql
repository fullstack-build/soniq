CREATE FUNCTION current_user() RETURNS text AS $$
DECLARE
    v_key   TEXT;
    v_parts TEXT[];
    v_uname TEXT;
    v_value TEXT;
    v_timestamp INT;
    v_signature TEXT;
BEGIN

    -- no password verification this time
    SELECT sign_key INTO v_key FROM secrets;

    v_parts := regexp_split_to_array(current_setting('my.username', true), ':');
    v_uname := v_parts[1];
    v_timestamp := v_parts[2];
    v_signature := v_parts[3];

    v_value := v_uname || ':' || v_timestamp || ':' || v_key;
    IF v_signature = crypt(v_value, v_signature) THEN
        RETURN v_uname;
    END IF;

    RAISE EXCEPTION 'invalid username / timestamp';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;