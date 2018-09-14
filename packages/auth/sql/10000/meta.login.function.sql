-- login returns a user-token and other data required for the jwt token if the hash matches
CREATE OR REPLACE FUNCTION _meta.login(i_user_id TEXT, i_provider TEXT, i_pw_hash TEXT, i_client_identifier TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_token_secret TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_auth_pw_secret TEXT;
    v_bf_iter_count INT;
    v_query TEXT;
    v_pw_hash TEXT;
    v_pw_hash_check TEXT;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_user_token TEXT;
    v_refresh_token_secret TEXT;
    v_refresh_token_payload TEXT;
    v_refresh_token TEXT;
BEGIN
    -- Check if the user is admin. Raise exception if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- TODO: We may want to rewrite this queries into one query
    -- Get required values from Auth-table
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_pw_secret FROM _meta."Auth" WHERE key = 'auth_pw_secret';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';
    SELECT value INTO v_refresh_token_secret FROM _meta."Auth" WHERE key = 'refresh_token_secret';

    -- Get password-hash and userId of user by userId and provider
    v_query := $tok$SELECT %I->'providers'->%L->>'hash', id FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw_hash, v_user_id;

    -- Check if pwHash, userId is not null. (Checking userId validates if the user exists)
    IF v_pw_hash IS NULL OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Login failed!';
    END IF;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    -- This hash of the input-hash ensures, that if anyone has access to the user's password-field he cannot create a user-token.
    -- It includes the auth_pw_secret
    v_pw_hash_check := crypt(encode(digest(i_pw_hash || v_auth_pw_secret, 'sha256'), 'hex'), v_pw_hash);

    -- Check if the hash is correct. Raise exception if not.
    IF v_pw_hash != v_pw_hash_check THEN
        RAISE EXCEPTION 'Login failed!';
    END IF;

    -- Here we know, the login-hash is correct and can create a user-token

    -- For the user-token we need to get a current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Build the payload of user-token signature
    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_secret;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    -- The user-token is just the hash of its signature-payload
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));

    v_refresh_token := NULL;

    IF i_client_identifier IS NOT NULL AND length(i_client_identifier) > 15 THEN
        v_refresh_token_payload := v_user_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
        v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));
    END IF;

    -- Return user-token-data
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', v_user_id, 'provider', i_provider,'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_max_age_in_seconds, 'provider', i_provider, 'refreshToken', v_refresh_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;