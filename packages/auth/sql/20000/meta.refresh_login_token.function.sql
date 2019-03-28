-- refresh_login_token checks the loginToken and refreshToken, creates a new session and invalidates the current one
CREATE OR REPLACE FUNCTION _meta.refresh_login_token(i_login_token TEXT, i_client_identifier TEXT, i_refresh_token TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_authentication_data jsonb;
    v_user_authentication_id TEXT;
    v_auth_factor_ids_jsonb jsonb;
    v_auth_factor_ids TEXT[];
    v_auth_factor_hashes TEXT[];
    v_provider_set_array TEXT[];
    v_provider_set TEXT;

    v_auth_factor_id TEXT;
    v_auth_factor_hash TEXT;
    v_auth_factor_provider TEXT;
    
    v_any_result TEXT;
    
    v_user_authentication_user_id TEXT;
    v_user_authentication_active BOOLEAN;
    v_login_provider_sets TEXT[];
    
    v_query TEXT;
    
    v_login_token_secret TEXT;
    v_login_token_bf_iter_count INT;
    v_login_token_max_age_in_seconds INT;
    v_refresh_token_secret TEXT;
    v_refresh_token_bf_iter_count INT;
    
    v_issued_at BIGINT;
    v_login_token_payload TEXT;
    v_login_token_signature TEXT;
    v_login_token TEXT;
    v_refresh_token_payload TEXT;
    v_refresh_token TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- Check if the login token is valid => This throws an error
    v_user_authentication_data := _meta.validate_login_token(i_login_token);
    
    v_user_authentication_id := v_user_authentication_data->>'userAuthenticationId';
    v_auth_factor_ids_jsonb := v_user_authentication_data->'authFactorIds';
    SELECT ARRAY(SELECT jsonb_array_elements_text(v_auth_factor_ids_jsonb)) INTO v_auth_factor_ids;

    v_any_result := _meta.invalidate_login_token(i_login_token);

    FOREACH v_auth_factor_id IN ARRAY v_auth_factor_ids
    LOOP
      v_query := $tok$ SELECT "hash", "provider" FROM "_meta"."AuthFactor" WHERE "id" = %L $tok$;
      EXECUTE format(v_query, v_auth_factor_id) INTO v_auth_factor_hash, v_auth_factor_provider;  

      v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
      v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;

    v_provider_set_array := _meta.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');

    v_query := $tok$ SELECT "userId", "isActive", "loginProviderSets" FROM "_meta"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_user_authentication_id) INTO v_user_authentication_user_id, v_user_authentication_active, v_login_provider_sets;

    IF v_user_authentication_user_id IS NULL THEN
      RAISE EXCEPTION 'Login refresh failed! UserId not found.';
    END IF;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Login refresh failed! UserAuthentication inactive.';
    END IF;

    IF NOT v_provider_set = ANY(v_login_provider_sets) THEN
      RAISE EXCEPTION 'Login refresh failed! Invalid ProviderSet.';
    END IF;

    -- Validate Refresh Token
    SELECT value INTO v_refresh_token_secret FROM _meta."Auth" WHERE key = 'refresh_token_secret';

    v_refresh_token_payload := i_login_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), i_refresh_token);

    IF i_refresh_token != v_refresh_token THEN
      RAISE EXCEPTION 'Login refresh failed! Invalid RefreshToken.';
    END IF;

    -- Here we know, the login-hash is correct and can create a login-token
  
    SELECT value INTO v_login_token_secret FROM _meta."Auth" WHERE key = 'login_token_secret';
    SELECT value INTO v_login_token_bf_iter_count FROM _meta."Auth" WHERE key = 'login_token_bf_iter_count';
    SELECT value INTO v_login_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'login_token_max_age_in_seconds';
  
    SELECT value INTO v_refresh_token_bf_iter_count FROM _meta."Auth" WHERE key = 'refresh_token_bf_iter_count';
  
    -- For the login-token we need to get a current timestamp
    v_issued_at := (round(extract(epoch from now())*1000))::bigint;
  
    -- Build the payload of login-token signature
    v_login_token_payload := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || array_to_string(v_auth_factor_hashes, ':') || ';' || v_login_token_secret;
  
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_login_token_signature := crypt(encode(digest(v_login_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_login_token_bf_iter_count));
  
    -- Build Login-Token for Export
    v_login_token := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || v_login_token_signature;
  
    v_refresh_token_payload := v_login_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_refresh_token_bf_iter_count));
  
    RETURN jsonb_build_object('loginToken', v_login_token, 'issuedAt', v_issued_at, 'refreshToken', v_refresh_token, 'userId', v_user_authentication_user_id, 'loginTokenMaxAgeInSeconds', v_login_token_max_age_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;