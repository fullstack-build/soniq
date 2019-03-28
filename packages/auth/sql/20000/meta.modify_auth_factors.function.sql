-- modify_auth_factors function creates a new AuthFactors and removes old ones
CREATE OR REPLACE FUNCTION _meta.modify_auth_factors(i_auth_factors jsonb, i_is_active BOOLEAN, i_login_provider_sets TEXT[], i_modify_provider_sets TEXT[], i_new_auth_factors jsonb, i_remove_auth_factor_ids TEXT[]) RETURNS void AS $$
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
    v_modify_provider_sets TEXT[];
    
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

    v_protected_hash TEXT;
    v_is_user_authentication_valid BOOLEAN;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    
    v_previous_user_authentication_id := NULL;
    v_auth_factor_ids := ARRAY[]::TEXT[];
    v_auth_factor_hashes := ARRAY[]::TEXT[];
    
    FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_auth_factors)
    LOOP
      -- First get some data
      v_query := $tok$ SELECT "userAuthenticationId", "hash", "provider" FROM "_meta"."AuthFactor" WHERE "id" = %L $tok$;
      EXECUTE format(v_query, v_auth_factor->>'id') INTO v_user_authentication_id, v_auth_factor_hash, v_auth_factor_provider;
    
      -- Check if anything is NULL
      IF v_user_authentication_id IS NULL OR v_auth_factor_hash IS NULL THEN
          RAISE EXCEPTION 'Authentication failed! AuthFactor invalid.';
      END IF;
      
      -- initialize previous id for checks
      IF v_previous_user_authentication_id IS NULL THEN
        v_previous_user_authentication_id := v_user_authentication_id;
      END IF;
      
      -- every auth-factor needs to refer to the same user-authentication
      IF v_previous_user_authentication_id != v_user_authentication_id THEN
        RAISE EXCEPTION 'Authentication failed! Invalid AuthFactor set.';
      END IF;
      
      v_previous_user_authentication_id := v_user_authentication_id;
    
      -- create a new hash based on the old one because it includes a salt
        v_validation_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), v_auth_factor_hash);
    
        IF v_auth_factor_hash != v_validation_hash THEN
        RAISE EXCEPTION 'Authentication failed! AuthFactor hash not matching.';
        END IF;
        
        v_auth_factor_ids := array_append(v_auth_factor_ids, v_auth_factor->>'id');
        v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
        v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;
    
    v_provider_set_array := _meta.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');
  
    v_query := $tok$ SELECT "userId", "isActive", "modifyProviderSets" FROM "_meta"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_previous_user_authentication_id) INTO v_user_authentication_user_id, v_user_authentication_active, v_modify_provider_sets;

    IF v_user_authentication_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication failed! UserId not found.';
    END IF;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Authentication failed! UserAuthentication inactive.';
    END IF;

    IF NOT v_provider_set = ANY(v_modify_provider_sets) THEN
      RAISE EXCEPTION 'Authentication failed! Invalid ProviderSet.';
    END IF;

    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    SELECT value INTO v_hash_bf_iter_count FROM _meta."Auth" WHERE key = 'hash_bf_iter_count';

    -- Set new providerSets and active status
    v_query := $tok$ UPDATE "_meta"."UserAuthentication" SET "isActive" = %L, "loginProviderSets" = %L, "modifyProviderSets" = %L WHERE "id" = %L; $tok$;
    EXECUTE format(v_query, i_is_active, i_login_provider_sets, i_modify_provider_sets, v_previous_user_authentication_id);

    -- remove old auth factiors
    FOREACH v_auth_factor_id IN ARRAY i_remove_auth_factor_ids
    LOOP
      v_query := $tok$ DELETE FROM "_meta"."AuthFactor" WHERE "id" = %L; $tok$;
      EXECUTE format(v_query, v_auth_factor_id);
    END LOOP;

    -- create new auth factors
    FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_new_auth_factors)
    LOOP
      v_protected_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), gen_salt('bf', v_hash_bf_iter_count));
    
      v_query := $tok$ INSERT INTO "_meta"."AuthFactor"("userAuthenticationId", "provider", "meta", "hash") VALUES(%L, %L, %L, %L) $tok$;
      EXECUTE format(v_query, v_previous_user_authentication_id, v_auth_factor->>'provider', v_auth_factor->>'meta', v_protected_hash);
    END LOOP;
    
    -- Check if the created authentication and authFactor set is valid
    v_is_user_authentication_valid := _meta.is_user_authentication_valid(v_previous_user_authentication_id);
    IF v_is_user_authentication_valid = FALSE THEN
        RAISE EXCEPTION 'ProviderSets are not valid in combination with AuthFactors.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;