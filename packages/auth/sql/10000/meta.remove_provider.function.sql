-- remove_provider removes a connected auth-provider from a users password-field
CREATE OR REPLACE FUNCTION _meta.remove_provider(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT, i_remove_provider TEXT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_is_user_token_temp_valid BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_query TEXT;
    v_user_id TEXT;
    v_password jsonb;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- Check if the token is valid as user-token or user-token-temp and is not older than user_token_temp_max_age_in_seconds. Raise exeption if not.
    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, true);
    v_is_user_token_temp_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, true, true);
    IF v_is_user_token_valid = FALSE AND v_is_user_token_temp_valid = FALSE THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- Provider can't be the current token provider and provider "local" cannot be removed
    IF i_provider = i_remove_provider OR i_remove_provider = 'local' THEN
        RAISE EXCEPTION 'You cannot remove the provider of your current session.';
    END IF;

    -- TODO: We may could improve this to one query
    -- Get required values from Auth-table
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';

    -- Get userId and password-field from user by userId
    v_query := $tok$SELECT id, %I FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password;

    -- Check if user exists and password-field is not null
    IF v_user_id IS NULL OR v_password IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- Set provider to remove to null
    v_password := jsonb_set(v_password, ARRAY['providers', i_remove_provider], to_jsonb('null'::jsonb));

    -- Remove null providers
    v_password := jsonb_strip_nulls(v_password);

    -- Write updated password-field to db
    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;