-- create_user_authentication function creates a new entry in UserAuthentication and necessary AuthFactors RETURNS LoginData
CREATE OR REPLACE FUNCTION _auth.create_user_authentication(i_user_id TEXT, i_is_active boolean, i_login_provider_sets TEXT[], i_modify_provider_sets TEXT[], i_auth_factors jsonb) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_hash_secret TEXT;
    v_hash_bf_iter_count Int;
    v_query TEXT;
    v_user_authentication_id TEXT;
    v_auth_factor jsonb;
    v_protected_hash TEXT;
    v_is_user_authentication_valid BOOLEAN;
    v_match_count Int;
    v_is_proofed BOOLEAN;
    v_auth_factor_id TEXT;

    v_auth_factor_ids TEXT[];
    v_auth_factor_hashes TEXT[];
    v_provider_set_array TEXT[];
    v_provider_set TEXT;
    
    v_access_token_secret TEXT;
    v_access_token_bf_iter_count INT;
    v_access_token_max_age_in_seconds INT;
    
    v_issued_at BIGINT;
    v_access_token_payload TEXT;
    v_access_token_signature TEXT;
    v_access_token TEXT;
    v_refresh_token TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    v_auth_factor_ids := ARRAY[]::TEXT[];
    v_auth_factor_hashes := ARRAY[]::TEXT[];
    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    SELECT value INTO v_hash_bf_iter_count FROM _meta."Auth" WHERE key = 'hash_bf_iter_count';

    v_query := $tok$ INSERT INTO "_auth"."UserAuthentication"("userId", "isActive", "loginProviderSets", "modifyProviderSets") VALUES(%L, %L, %L, %L) RETURNING "id" $tok$;
    EXECUTE format(v_query, i_user_id, i_is_active, i_login_provider_sets, i_modify_provider_sets) INTO v_user_authentication_id;

    FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_auth_factors)
    LOOP
        v_protected_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), gen_salt('bf', v_hash_bf_iter_count));

        v_query := $tok$ SELECT count(*) FROM _auth."AuthFactor" af WHERE "deletedAt" IS NULL AND af."communicationAddress" IS NOT NULL AND af."communicationAddress" = %L AND _auth.get_tenant_by_userid((SELECT "userId" FROM "_auth"."UserAuthentication" WHERE id = af."userAuthenticationId")::TEXT) = _auth.get_tenant_by_userid(%L); $tok$;
        EXECUTE format(v_query, v_auth_factor->>'communicationAddress', i_user_id) INTO v_match_count;

        IF v_match_count > 0 THEN
            RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: CommunicationAddress (%) is already used.', v_auth_factor->>'communicationAddress';
        END IF;

        v_query := $tok$ INSERT INTO "_auth"."AuthFactor"("userAuthenticationId", "provider", "meta", "hash", "communicationAddress") VALUES(%L, %L, %L, %L, %L) RETURNING "id"; $tok$;

        v_is_proofed := v_auth_factor->>'isProofed';
        IF v_is_proofed IS TRUE THEN
            v_query := $tok$ INSERT INTO "_auth"."AuthFactor"("userAuthenticationId", "provider", "meta", "hash", "communicationAddress", "proofedAt") VALUES(%L, %L, %L, %L, %L, timezone('UTC'::text, now())) RETURNING "id"; $tok$;
        END IF;

        EXECUTE format(v_query, v_user_authentication_id, v_auth_factor->>'provider', v_auth_factor->>'meta', v_protected_hash, v_auth_factor->>'communicationAddress') INTO v_auth_factor_id;

        v_auth_factor_ids := array_append(v_auth_factor_ids, v_auth_factor_id);
        v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_protected_hash);
        v_provider_set_array := array_append(v_provider_set_array, v_auth_factor->>'provider');
    END LOOP;

    v_provider_set_array := _auth.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');

    -- Check if the created authentication and authFactor set is valid
    v_is_user_authentication_valid := _auth.is_user_authentication_valid(v_user_authentication_id);
    IF v_is_user_authentication_valid = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: ProviderSets are not valid in combination with AuthFactors.';
    END IF;

    RETURN jsonb_build_object('userId', i_user_id, 'userAuthenticationId', v_user_authentication_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;