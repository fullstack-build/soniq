-- refresh_user_token invalidates the current token, and creates a new one
CREATE OR REPLACE FUNCTION _meta.refresh_user_token(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT, i_client_identifier TEXT, i_refresh_token TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_query TEXT;
    v_invalid_tokens BIGINT[];
    v_user_id TEXT;
    v_password jsonb;
    v_timestamp BIGINT;
    v_counter INT;
    v_ts_to_clear BIGINT[];
    v_new_pw TEXT;
    v_pw_hash TEXT;
    i BIGINT;
    v_max INT;
    v_payload TEXT;
    v_user_token TEXT;
    v_refresh_token_secret TEXT;
    v_refresh_token_payload TEXT;
    v_refresh_token TEXT;
    v_user_token_secret TEXT;
    v_bf_iter_count INT;
BEGIN
    -- Check if the user is admin. Raise exception if not.
	v_is_admin := _meta.is_admin();
	IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- Check if the user-token is valid. Return if not.
    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, false);
    IF v_is_user_token_valid = FALSE THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- TODO: We may want to rewrite this queries into one query
    -- Get required values from Auth-table
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_refresh_token_secret FROM _meta."Auth" WHERE key = 'refresh_token_secret';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';

    -- Get current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Get current invalidTokens, passwordField and userId from user by userId
    v_query := $tok$SELECT id, %I, ARRAY(SELECT jsonb_array_elements_text(%I->'invalidTokens')) FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password, v_invalid_tokens;

    -- Check if the user exists and params are not null
    IF v_user_id IS NULL OR v_password IS NULL OR v_invalid_tokens IS NULL THEN
        RAISE EXCEPTION 'Invalidation failed!';
    END IF;

    -- Initialise variables
    v_ts_to_clear := ARRAY[]::BIGINT[];
    v_counter := 0;
    v_max := array_length(v_invalid_tokens, 1) + 1;

    -- Find token-timestamps in invalidTokens, which are expired anyway.
    LOOP
        EXIT WHEN v_max IS NULL OR v_counter >= v_max;
        v_counter := v_counter + 1;
        IF v_timestamp - v_invalid_tokens[v_counter]::bigint > (v_user_token_max_age_in_seconds * 1000) THEN
            v_ts_to_clear := array_append(v_ts_to_clear, v_invalid_tokens[v_counter]);
        END IF;
    END LOOP;

    -- Remove token-timestamps from invalidTokens, which are expired anyway.
    FOREACH i IN ARRAY v_ts_to_clear
    LOOP
        v_invalid_tokens := array_remove(v_invalid_tokens, i);
    END LOOP;

    -- Append the token-timestamp of the current user-token to invalidate it.
    v_invalid_tokens := array_append(v_invalid_tokens, i_timestamp::bigint);

    -- Set new invalidTokens array into passwords-field
    v_password := jsonb_set(v_password, ARRAY['invalidTokens'], to_jsonb(v_invalid_tokens));

    -- Write the updated password-field to db
    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);

    -- Now the current session has been invalidated
    -- Let's check the refresh token to create a new user token

    v_refresh_token := NULL;

    IF i_client_identifier IS NULL OR length(i_client_identifier) < 16 THEN
        RAISE EXCEPTION 'Validating refresh-token failed.';
    END IF;

    v_refresh_token_payload := i_user_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), i_refresh_token);

    IF v_refresh_token != i_refresh_token THEN
        RAISE EXCEPTION 'Validating refresh-token failed.';
    END IF;

    -- Here the refresh-token is valid
    -- Let's create a new user token

    -- Get password-hash and userId of user by userId and provider
    v_query := $tok$SELECT %I->'providers'->%L->>'hash', id FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw_hash, v_user_id;

    -- Check if pwHash, userId is not null. (Checking userId validates if the user exists)
    IF v_pw_hash IS NULL OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Validating refresh-token failed.';
    END IF;

    -- For the user-token we need to get a current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Build the payload of user-token signature
    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_secret;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    -- The user-token is just the hash of its signature-payload
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));

    v_refresh_token_payload := v_user_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));

    -- Return user-token-data
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', v_user_id, 'provider', i_provider,'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_max_age_in_seconds, 'provider', i_provider, 'refreshToken', v_refresh_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;