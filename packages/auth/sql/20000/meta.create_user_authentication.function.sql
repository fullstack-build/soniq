-- create_user_authentication function creates a new entry in UserAuthentication and necessary AuthFactors
CREATE OR REPLACE FUNCTION _meta.create_user_authentication(i_user_id TEXT, i_is_active boolean, i_login_provider_sets TEXT[], i_modify_provider_sets TEXT[], i_auth_factors jsonb) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_hash_secret TEXT;    
    v_hash_bf_iter_count Int;
    v_query TEXT;
    v_user_authentication_id TEXT;
    v_auth_factor jsonb;
    v_protected_hash TEXT;
    v_is_user_authentication_valid BOOLEAN;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';
    SELECT value INTO v_hash_bf_iter_count FROM _meta."Auth" WHERE key = 'hash_bf_iter_count';

    v_query := $tok$ INSERT INTO "_meta"."UserAuthentication"("userId", "isActive", "loginProviderSets", "modifyProviderSets") VALUES(%L, %L, %L, %L) RETURNING "id" $tok$;
    EXECUTE format(v_query, i_user_id, i_is_active, i_login_provider_sets, i_modify_provider_sets) INTO v_user_authentication_id;

    FOR v_auth_factor IN SELECT * FROM jsonb_array_elements(i_auth_factors)
    LOOP
    	v_protected_hash := crypt(encode(digest(v_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), gen_salt('bf', v_hash_bf_iter_count));
    
     	v_query := $tok$ INSERT INTO "_meta"."AuthFactor"("userAuthenticationId", "provider", "meta", "hash") VALUES(%L, %L, %L, %L) $tok$;
    	EXECUTE format(v_query, v_user_authentication_id, v_auth_factor->>'provider', v_auth_factor->>'meta', v_protected_hash);
    END LOOP;
    
    -- Check if the created authentication and authFactor set is valid
    v_is_user_authentication_valid := _meta.is_user_authentication_valid(v_user_authentication_id);
    IF v_is_user_authentication_valid = FALSE THEN
        RAISE EXCEPTION 'ProviderSets are not valid in combination with AuthFactors.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TEST: SELECT _meta.create_user_authentication('6bb73379-8f49-43ef-a105-603f963114fa', TRUE, ARRAY['password'], ARRAY['email'], '[{"provider": "email", "meta": "1234", "hash": "huu"}, {"provider": "password", "meta": "5678", "hash": "huu"}]');