-- invalidate_user_token invalidates the current token, nothing else
CREATE OR REPLACE FUNCTION _meta.invalidate_user_token(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT) RETURNS void AS $$
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
    i BIGINT;
    v_max INT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
	v_is_admin := _meta.is_admin();
	IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- Check if the user-token is valid. Return if not.
    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, false);
    IF v_is_user_token_valid = FALSE THEN
        RETURN;
    END IF;

    -- TODO: We may want to rewrite this to one query
    -- Get required values from Auth-table
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';

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
END;
$$ LANGUAGE plpgsql;