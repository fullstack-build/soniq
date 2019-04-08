-- login function checks provided AuthFactors and returns a accessToken and refreshToken
CREATE OR REPLACE FUNCTION _meta.login(i_auth_factors jsonb, i_client_identifier TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_hash_secret TEXT;    
    v_hash_bf_iter_count Int;
    
    v_auth_factor_ids TEXT[];
    v_auth_factor_hashes TEXT[];
    v_provider_set_array TEXT[];
    v_provider_set TEXT;

    v_query TEXT;
    v_user_authentication_id TEXT;
    v_previous_user_authentication_id TEXT;
    
    v_auth_factor jsonb;

    v_auth_factor_id TEXT;
    v_auth_factor_hash TEXT;
    v_auth_factor_created_at TEXT;
    v_auth_factor_provider TEXT;
    v_validation_hash TEXT;
    
    v_user_authentication_user_id TEXT;
    v_user_authentication_active BOOLEAN;
    v_login_provider_sets TEXT[];
    
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
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    
    v_previous_user_authentication_id := NULL;
    v_auth_factor_ids := ARRAY[]::TEXT[];
    v_auth_factor_hashes := ARRAY[]::TEXT[];
    
    FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_auth_factors)
    LOOP
      -- First get some data
      v_query := $tok$ SELECT "userAuthenticationId", "hash", "provider" FROM "_meta"."AuthFactor" WHERE "id" = %L AND "deletedAt" IS NULL; $tok$;
      EXECUTE format(v_query, v_auth_factor->>'id') INTO v_user_authentication_id, v_auth_factor_hash, v_auth_factor_provider;
    
      -- Check if anything is NULL
      IF v_user_authentication_id IS NULL OR v_auth_factor_hash IS NULL OR v_auth_factor_provider IS NULL THEN
          RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login failed! AuthFactor invalid.';
      END IF;
      
      -- initialize previous id for checks
      IF v_previous_user_authentication_id IS NULL THEN
        v_previous_user_authentication_id := v_user_authentication_id;
      END IF;
      
      -- every auth-factor needs to refer to the same user-authentication
      IF v_previous_user_authentication_id != v_user_authentication_id THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login failed! Invalid AuthFactor set.';
      END IF;
      
      v_previous_user_authentication_id := v_user_authentication_id;
    
      -- create a new hash based on the old one because it includes a salt
        v_validation_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), v_auth_factor_hash);
    
        IF v_auth_factor_hash != v_validation_hash THEN
            RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login failed! AuthFactor hash not matching.';
        END IF;
        
        v_auth_factor_ids := array_append(v_auth_factor_ids, v_auth_factor->>'id');
        v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
        v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;
    
    v_provider_set_array := _meta.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');
  
    v_query := $tok$ SELECT "userId", "isActive", "loginProviderSets" FROM "_meta"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_previous_user_authentication_id) INTO v_user_authentication_user_id, v_user_authentication_active, v_login_provider_sets;

    IF v_user_authentication_user_id IS NULL THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login failed! UserId not found.';
    END IF;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login failed! UserAuthentication inactive.';
    END IF;

    IF NOT v_provider_set = ANY(v_login_provider_sets) THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Login failed! Invalid ProviderSet.';
    END IF;
  
    -- Here we know, the login-hash is correct and can create a access-token
  
    SELECT value INTO v_access_token_secret FROM _meta."Auth" WHERE key = 'access_token_secret';
	  SELECT value INTO v_access_token_bf_iter_count FROM _meta."Auth" WHERE key = 'access_token_bf_iter_count';
	  SELECT value INTO v_access_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'access_token_max_age_in_seconds';
	
	  SELECT value INTO v_refresh_token_secret FROM _meta."Auth" WHERE key = 'refresh_token_secret';
	  SELECT value INTO v_refresh_token_bf_iter_count FROM _meta."Auth" WHERE key = 'refresh_token_bf_iter_count';
	
	  -- For the access-token we need to get a current timestamp
	  v_issued_at := (round(extract(epoch from now())*1000))::bigint;
	
	  -- Build the payload of access-token signature
	  v_access_token_payload := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || array_to_string(v_auth_factor_hashes, ':') || ';' || v_access_token_secret;
	
	  -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
	  v_access_token_signature := crypt(encode(digest(v_access_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_access_token_bf_iter_count));
	
	  -- Build AccessToken for Export
	  v_access_token := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || v_access_token_signature;
	
	  v_refresh_token := NULL;
	
	  IF i_client_identifier IS NOT NULL AND length(i_client_identifier) > 15 THEN
	    v_refresh_token_payload := v_access_token || ':' || i_client_identifier || ':' || v_refresh_token_secret;
	    v_refresh_token := crypt(encode(digest(v_refresh_token_payload, 'sha256'), 'hex'), gen_salt('bf', v_refresh_token_bf_iter_count));
	  END IF;
	
	  RETURN jsonb_build_object('accessToken', v_access_token, 'issuedAt', v_issued_at, 'refreshToken', v_refresh_token, 'userId', v_user_authentication_user_id, 'accessTokenMaxAgeInSeconds', v_access_token_max_age_in_seconds, 'providerSet', v_provider_set);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;