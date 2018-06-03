-- set_password sets the password of user by provider. It the provider does not exist it will be created
CREATE OR REPLACE FUNCTION _meta.set_password(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT, i_set_provider TEXT, i_pw_hash TEXT, i_pw_meta jsonb) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_is_user_token_temp_valid BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_auth_pw_secret TEXT;
    v_auth_providers_str TEXT;
    v_auth_providers TEXT[];
    v_query TEXT;
    v_pw_bf_iter_count Int;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_pw_hash TEXT;
    v_provider jsonb;
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

    -- TODO: We may could improve this to one query
    -- Get required values from Auth-table
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_pw_secret FROM _meta."Auth" WHERE key = 'auth_pw_secret';
    SELECT value INTO v_auth_providers_str FROM _meta."Auth" WHERE key = 'auth_providers';
    SELECT value INTO v_pw_bf_iter_count FROM _meta."Auth" WHERE key = 'pw_bf_iter_count';

    -- Get the list of allowed providers
    v_auth_providers := regexp_split_to_array(v_auth_providers_str, ':');

    -- Check if the provider-list contains any providers
    IF array_length(v_auth_providers, 1) < 1 THEN
    	RAISE EXCEPTION 'Auth provider does not exist!';
    END IF;

    -- Check if the requested provider is allowed
    IF array_position(v_auth_providers, i_set_provider) IS NULL THEN
        RAISE EXCEPTION 'Auth provider does not exist!';
    END IF;

    -- Get userId and password-field from user by userId
    v_query := $tok$SELECT id, %I FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password;

    -- Check if the user exists and password-field is not null
    IF v_user_id IS NULL OR v_password IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- Get current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    -- This hash of the input-hash ensures, that if anyone has access to the user's password-field he cannot create a user-token.
    -- It includes the auth_pw_secret
    v_pw_hash := crypt(encode(digest(i_pw_hash || v_auth_pw_secret, 'sha256'), 'hex'), gen_salt('bf', v_pw_bf_iter_count));

    -- Create a new provider object with the current hash and metas
    v_provider := jsonb_build_object('hash', v_pw_hash, 'meta', i_pw_meta);

    -- Set the provider into password-field
    v_password := jsonb_set(v_password, ARRAY['providers', i_set_provider], v_provider);

    -- If the password was set with a temporary user-token => Invalidate all other user-tokens issued before incuding the temporary one.
    -- So the user is required to login after setting a new password, when he has registered or forgot his password before,
    -- but not when he just set a new password while a session with another auth-provider.
    IF v_is_user_token_temp_valid = true THEN
        v_password := jsonb_set(v_password, ARRAY['totalLogoutTimestamp'], to_jsonb(v_timestamp));
    END IF;

    -- Write the updated password-field to db
    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;