-- register_user() creates a new user by username and tenant, returning a temprary user-token to set a password later
CREATE OR REPLACE FUNCTION _meta.initialize_user(i_user_id TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin   BOOLEAN;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_password   TEXT;
    v_auth_field_username   TEXT;
    v_user_token_temp_secret TEXT;
    v_user_token_temp_max_age_in_seconds BIGINT;
    v_query TEXT;
    v_pw_bf_iter_count Int;
    v_bf_iter_count Int;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_random_pw TEXT;
    v_pw_hash TEXT;
    v_meta jsonb;
    v_providers jsonb;
    v_password jsonb;
    v_payload TEXT;
    v_user_token TEXT;
    v_username TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- TODO: We may want to rewrite this queries into one query
    -- Get required values from Auth-table
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_user_token_temp_secret FROM _meta."Auth" WHERE key = 'user_token_temp_secret';
    SELECT value INTO v_user_token_temp_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_temp_max_age_in_seconds';
    SELECT value INTO v_pw_bf_iter_count FROM _meta."Auth" WHERE key = 'pw_bf_iter_count';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';

    v_query := $tok$SELECT id, %I FROM %I.%I WHERE id = %L AND %I IS NULL$tok$;
    EXECUTE format(v_query, v_auth_field_username, v_auth_table_schema, v_auth_table, i_user_id, v_auth_field_password) INTO v_user_id, v_username;

    IF v_user_id IS NULL OR v_username IS NULL THEN
        RAISE EXCEPTION 'This user has already been initailized.';
    END IF;


    -- Create content of new password field

    -- Get current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Generate random pwHash
    -- (This password will not be valid because it wasn't hashed by node)
    -- (It is just created to be able to build a user-token-temp which will be used to set the real password)
    v_random_pw = crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 6));

    -- Hash the pwHash
    -- This hash of the input-hash ensures, that if anyone has access to the user's password-field he cannot create a user-token.
    -- It does not contain the auth_pw_secret. Thereby it cannot be used to login.
    v_pw_hash := crypt(encode(digest(v_random_pw, 'sha256'), 'hex'), gen_salt('bf', v_pw_bf_iter_count));

    -- Create default/random pwMeta
    -- They will never be used anyway. This is just for initialisation
    v_meta := jsonb_build_object('salt', encode(gen_random_bytes(16), 'hex'), 'memlimit', 67108864, 'opslimit', 2, 'algorithm', 2, 'hashBytes', 128);

    -- Create the local provider with v_meta and v_pw_hash
    v_providers := jsonb_build_object('local', jsonb_build_object('hash', v_pw_hash, 'meta', v_meta));

    -- Build the initial password-field for the user
    v_password := jsonb_build_object('providers', v_providers, 'totalLogoutTimestamp', 0, 'invalidTokens', to_jsonb(ARRAY[]::BIGINT[]));

    -- Write the new password-field to db
    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L AND %I IS NULL', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id, v_auth_field_password);

    -- Create signature-payload with user_token_temp_secret to create a temporary user-token which can be used to set a password.
    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_temp_secret;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    -- Create the user token by hashing the payload
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));

    -- Return token-data as jsonb including userToken
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', i_user_id, 'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_temp_max_age_in_seconds, 'provider', 'local', 'username', v_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;