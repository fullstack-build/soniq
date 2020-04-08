-- modify_user_authentication function creates a new AuthFactors and removes old ones
CREATE OR REPLACE FUNCTION _auth.modify_user_authentication(i_auth_factors jsonb, i_is_active BOOLEAN, i_login_provider_sets TEXT[], i_modify_provider_sets TEXT[], i_new_auth_factors jsonb, i_remove_auth_factor_ids TEXT[]) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_hash_secret TEXT;    
    v_hash_bf_iter_count Int;
    v_match_count Int;
    
    v_auth_factor_ids TEXT[];
    v_auth_factor_hashes TEXT[];
    v_provider_set_array TEXT[];
    v_provider_set TEXT;

    v_default_is_active BOOLEAN;
    v_default_login_provider_sets TEXT[];
    v_default_modify_provider_sets TEXT[];
    v_default_new_auth_factors jsonb;
    v_default_remove_auth_factor_ids TEXT[];

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

    v_protected_hash TEXT;
    v_is_user_authentication_valid BOOLEAN;
    v_is_proofed BOOLEAN;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    
    v_previous_user_authentication_id := NULL;
    v_auth_factor_ids := ARRAY[]::TEXT[];
    v_auth_factor_hashes := ARRAY[]::TEXT[];
    
    FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_auth_factors)
    LOOP
      -- First get some data
      v_query := $tok$ SELECT "userAuthenticationId", "hash", "provider" FROM "_auth"."AuthFactor" WHERE "id" = %L AND "deletedAt" IS NULL; $tok$;
      EXECUTE format(v_query, v_auth_factor->>'id') INTO v_user_authentication_id, v_auth_factor_hash, v_auth_factor_provider;
    
      -- Check if anything is NULL
      IF v_user_authentication_id IS NULL OR v_auth_factor_hash IS NULL OR v_auth_factor_provider IS NULL THEN
          RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Authentication failed! AuthFactor invalid.';
      END IF;
      
      -- initialize previous id for checks
      IF v_previous_user_authentication_id IS NULL THEN
        v_previous_user_authentication_id := v_user_authentication_id;
      END IF;
      
      -- every auth-factor needs to refer to the same user-authentication
      IF v_previous_user_authentication_id != v_user_authentication_id THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Authentication failed! Invalid AuthFactor set.';
      END IF;
      
      v_previous_user_authentication_id := v_user_authentication_id;
    
      -- create a new hash based on the old one because it includes a salt
        v_validation_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), v_auth_factor_hash);
    
        IF v_auth_factor_hash != v_validation_hash THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Authentication failed! AuthFactor hash not matching.';
        END IF;
        
        v_auth_factor_ids := array_append(v_auth_factor_ids, v_auth_factor->>'id');
        v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
        v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;
    
    v_provider_set_array := _auth.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');
  
    v_query := $tok$ SELECT "userId", "isActive", "modifyProviderSets" FROM "_auth"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_previous_user_authentication_id) INTO v_user_authentication_user_id, v_user_authentication_active, v_modify_provider_sets;

    IF v_user_authentication_user_id IS NULL THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Authentication failed! UserId not found.';
    END IF;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Authentication failed! UserAuthentication inactive.';
    END IF;

    IF NOT v_provider_set = ANY(v_modify_provider_sets) THEN
      RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Authentication failed! Invalid ProviderSet.';
    END IF;

    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    SELECT value INTO v_hash_bf_iter_count FROM _meta."Auth" WHERE key = 'hash_bf_iter_count';

    -- Set new providerSets and active status
    v_query := $tok$ UPDATE "_auth"."UserAuthentication" SET "isActive" = COALESCE(%L, "isActive"), "loginProviderSets" = COALESCE(%L, "loginProviderSets"), "modifyProviderSets" = COALESCE(%L, "modifyProviderSets") WHERE "id" = %L; $tok$;
    EXECUTE format(v_query, i_is_active, i_login_provider_sets, i_modify_provider_sets, v_previous_user_authentication_id);

    -- remove old auth factiors
    IF i_remove_auth_factor_ids IS NOT NULL THEN
        FOREACH v_auth_factor_id IN ARRAY i_remove_auth_factor_ids
        LOOP
            -- v_query := $tok$ DELETE FROM "_auth"."AuthFactor" WHERE "id" = %L; $tok$;
            v_query := $tok$ UPDATE "_auth"."AuthFactor" SET "deletedAt" = timezone('UTC'::text, now()) WHERE "id" = %L; $tok$;
            EXECUTE format(v_query, v_auth_factor_id);
        END LOOP;
    END IF;

    -- create new auth factors
    IF i_new_auth_factors IS NOT NULL THEN
        FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_new_auth_factors)
        LOOP
            v_protected_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), gen_salt('bf', v_hash_bf_iter_count));

            v_query := $tok$ SELECT count(*) FROM _auth."AuthFactor" af WHERE "deletedAt" IS NULL AND af."communicationAddress" IS NOT NULL AND af."communicationAddress" = %L AND _auth.get_tenant_by_userid((SELECT "userId" FROM "_auth"."UserAuthentication" WHERE id = af."userAuthenticationId")::TEXT) = _auth.get_tenant_by_userid(%L); $tok$;
            EXECUTE format(v_query, v_auth_factor->>'communicationAddress', v_user_authentication_user_id) INTO v_match_count;

            IF v_match_count > 0 THEN
                RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: CommunicationAddress (%) is already used.', v_auth_factor->>'communicationAddress';
            END IF;
        
            v_query := $tok$ INSERT INTO "_auth"."AuthFactor"("userAuthenticationId", "provider", "meta", "hash", "communicationAddress") VALUES(%L, %L, %L, %L, %L) $tok$;
            
            v_is_proofed := v_auth_factor->>'isProofed';
            IF v_is_proofed IS TRUE THEN
                v_query := $tok$ INSERT INTO "_auth"."AuthFactor"("userAuthenticationId", "provider", "meta", "hash", "communicationAddress", "proofedAt") VALUES(%L, %L, %L, %L, %L, timezone('UTC'::text, now())) $tok$;
            END IF;

            EXECUTE format(v_query, v_previous_user_authentication_id, v_auth_factor->>'provider', v_auth_factor->>'meta', v_protected_hash, v_auth_factor->>'communicationAddress');
        END LOOP;
    END IF;
    
    -- Check if the created authentication and authFactor set is valid
    v_is_user_authentication_valid := _auth.is_user_authentication_valid(v_previous_user_authentication_id);
    IF v_is_user_authentication_valid = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: ProviderSets are not valid in combination with AuthFactors.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;