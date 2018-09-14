-- forgot_password issues a temorary user-token which allowes a user to set a new password.
CREATE OR REPLACE FUNCTION _meta.forgot_password(i_username TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_username TEXT;
    v_auth_field_password TEXT;
    v_auth_field_tenant TEXT;
    v_query TEXT;
    v_pw_hash TEXT;
    v_user_token_temp_secret TEXT;
    v_user_token_temp_max_age_in_seconds BIGINT;
    v_bf_iter_count Int;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_user_token TEXT;
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
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_tenant FROM _meta."Auth" WHERE key = 'auth_field_tenant';
    SELECT value INTO v_user_token_temp_secret FROM _meta."Auth" WHERE key = 'user_token_temp_secret';
    SELECT value INTO v_user_token_temp_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_temp_max_age_in_seconds';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';

    -- Get current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Get pwHash and userId from user by username (and tenant if available) [use local stategie]
    IF v_auth_field_tenant IS NULL THEN
        v_query := $tok$SELECT %I->'providers'->'local'->>'hash', id FROM %I.%I WHERE %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username) INTO v_pw_hash, v_user_id;
    ELSE
        v_query := $tok$SELECT %I->'providers'->'local'->>'hash', id FROM %I.%I WHERE %I = %L AND %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username, v_auth_field_tenant, i_tenant) INTO v_pw_hash, v_user_id;
    END IF;

    -- Checks if user exists and pwHash is not null
    IF v_user_id IS NULL OR v_pw_hash IS NULL THEN
        RAISE EXCEPTION 'User or provider not found!';
    END IF;

    -- Create signature payload with user_token_temp_secret to create a temporary user-token.
    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_temp_secret;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    -- Create user-token by hashing the payload
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));

    -- Return jsonb token-data including temporary user-token
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', v_user_id, 'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_temp_max_age_in_seconds, 'provider', 'local');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;