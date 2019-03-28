-- get_auth_factor_for_proof function gives back meta data and id about an AuthFactor required to generate an AuthFactorProofToken
CREATE OR REPLACE FUNCTION _meta.get_auth_factor_for_proof(i_user_id TEXT, i_provider TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_query TEXT;
    v_auth_factor_id TEXT;
    v_auth_factor_meta TEXT;
    v_auth_factor_created_at TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
    
    v_query := $tok$ SELECT "id", "meta", "createdAt" FROM _meta."AuthFactor" WHERE "userAuthenticationId" = (SELECT "id" FROM _meta."UserAuthentication" WHERE "userId" = %L) AND "provider" = %L; $tok$;
    EXECUTE format(v_query, i_user_id, i_provider) INTO v_auth_factor_id, v_auth_factor_meta, v_auth_factor_created_at;
    
    RETURN jsonb_build_object('id', v_auth_factor_id, 'meta', v_auth_factor_meta, 'createdAt', v_auth_factor_created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;