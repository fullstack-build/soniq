-- get_auth_factor_for_proof function gives back meta data and id about an AuthFactor required to generate an AuthFactorProofToken
CREATE OR REPLACE FUNCTION _meta.get_auth_factor_for_proof(i_user_authentication_id TEXT, i_provider TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_query TEXT;
    v_auth_factor_id TEXT;
    v_auth_factor_meta TEXT;
    v_auth_factor_communication_address TEXT;
    v_auth_factor_created_at TEXT;
    v_user_id TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    v_query := $tok$ SELECT "id", "meta", "communicationAddress", "createdAt" FROM _meta."AuthFactor" WHERE "userAuthenticationId" = %L AND "provider" = %L AND "deletedAt" IS NULL; $tok$;
    EXECUTE format(v_query, i_user_authentication_id, i_provider) INTO v_auth_factor_id, v_auth_factor_meta, v_auth_factor_communication_address, v_auth_factor_created_at;
    
    v_query := $tok$ SELECT "userId" FROM _meta."UserAuthentication" WHERE "id" = %L; $tok$;
    EXECUTE format(v_query, i_user_authentication_id) INTO v_user_id;
    
    RETURN jsonb_build_object('id', v_auth_factor_id, 'meta', v_auth_factor_meta, 'communicationAddress', v_auth_factor_communication_address, 'createdAt', v_auth_factor_created_at, 'userAuthenticationId', i_user_authentication_id, 'userId', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;