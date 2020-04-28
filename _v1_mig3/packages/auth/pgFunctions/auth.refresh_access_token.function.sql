-- refresh_access_token checks the accessToken and refreshToken, creates a new session and invalidates the current one
CREATE OR REPLACE FUNCTION _auth.refresh_access_token(i_access_token TEXT, i_client_identifier TEXT, i_refresh_token TEXT) RETURNS jsonb AS $$
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
    
    v_access_token_secret TEXT;
    v_access_token_bf_iter_count INT;
    v_access_token_max_age_in_seconds INT;
    v_refresh_token_secret TEXT;
    v_refresh_token_bf_iter_count INT;
    
    v_issued_at BIGINT;
    v_access_token_payload TEXT;
    v_access_token_signature TEXT;
    v_access_token TEXT;
    v_refresh_token_payload TEXT;
    v_refresh_token TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    -- Check if the AccessToken is valid => This throws an error
    v_user_authentication_data := _auth.validate_access_token(i_access_token);
    
    v_user_authentication_id := v_user_authentication_data->>'userAuthenticationId';
    v_auth_factor_ids_jsonb := v_user_authentication_data->'authFactorIds';
    SELECT ARRAY(SELECT jsonb_array_elements_text(v_auth_factor_ids_jsonb)) INTO v_auth_factor_ids;

    v_any_result := _auth.invalidate_access_token(i_access_token);

    FOREACH v_auth_factor_id IN ARRAY v_auth_factor_ids
    LOOP
      v_query := $tok$ SELECT "hash", "provider" FROM "_auth"."AuthFactor" WHERE "id" = %L AND "deletedAt" IS NULL; $tok$;
      EXECUTE format(v_query, v_auth_factor_id) INTO v_auth_factor_hash, v_auth_factor_provider;  

      v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
      v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;

    v_provider_set_array := _auth.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');

    v_query := $tok$ SELECT "userId", "isActive", "loginProviderSets" FROM "_auth"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_user_authentication_id) INTO v_user_authentication_user_id, v_user_authentication_active, v_login_provider_sets;

    IF v_user_authentication_user_id IS NULL THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login refresh failed! UserId not found.';
    END IF;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login refresh failed! UserAuthentication inactive.';
    END IF;

    IF NOT v_provider_set = ANY(v_login_provider_sets) THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login refresh failed! Invalid ProviderSet.';
    END IF;

    -- Validate Refresh Token
    SELECT value INTO v_refresh_token_secret FROM _auth."Settings" WHERE key = 'refresh_token_secret';

    v_refresh_token_payload := i_access_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), i_refresh_token);

    IF i_refresh_token != v_refresh_token THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login refresh failed! Invalid RefreshToken.';
    END IF;

    -- Here we know, the login-hash is correct and can create a access-token
  
    SELECT value INTO v_access_token_secret FROM _auth."Settings" WHERE key = 'access_token_secret';
    SELECT value INTO v_access_token_bf_iter_count FROM _auth."Settings" WHERE key = 'access_token_bf_iter_count';
    SELECT value INTO v_access_token_max_age_in_seconds FROM _auth."Settings" WHERE key = 'access_token_max_age_in_seconds';
  
    SELECT value INTO v_refresh_token_bf_iter_count FROM _auth."Settings" WHERE key = 'refresh_token_bf_iter_count';
  
    -- For the access-token we need to get a current timestamp
    v_issued_at := (round(extract(epoch from now())*1000))::bigint;
  
    -- Build the payload of access-token signature
    v_access_token_payload := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || array_to_string(v_auth_factor_hashes, ':') || ';' || v_access_token_secret;
  
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_access_token_signature := crypt(encode(digest(v_access_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_access_token_bf_iter_count));
  
    -- Build AccessToken for Export
    v_access_token := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || v_access_token_signature;
  
    v_refresh_token_payload := v_access_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_refresh_token_bf_iter_count));
  
    RETURN jsonb_build_object('accessToken', v_access_token, 'issuedAt', v_issued_at, 'refreshToken', v_refresh_token, 'userId', v_user_authentication_user_id, 'accessTokenMaxAgeInSeconds', v_access_token_max_age_in_seconds, 'providerSet', v_provider_set);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;