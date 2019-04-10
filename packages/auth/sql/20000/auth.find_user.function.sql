-- find_user function finds a user authentication id matching a communication_address and tenant
CREATE OR REPLACE FUNCTION _auth.find_user(i_communication_address TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_query TEXT;
    v_user_authentication_id TEXT;
    v_auth_factor_id TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    v_query := $tok$ SELECT (SELECT "id" FROM _auth."UserAuthentication" WHERE "id" = af."userAuthenticationId" AND _auth.get_tenant_by_userid("userId"::TEXT) = %L), "id" FROM "_auth"."AuthFactor" af WHERE "communicationAddress" = %L AND "deletedAt" IS NULL; $tok$;
    EXECUTE format(v_query, i_tenant, i_communication_address) INTO v_user_authentication_id, v_auth_factor_id;
    
    RETURN jsonb_build_object('userAuthenticationId', v_user_authentication_id, 'authFactorId', v_auth_factor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;