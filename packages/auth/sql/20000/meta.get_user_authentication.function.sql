-- get_user_authentication function gets the UserAuthentication data and AuthFactors of the user who is owning the accessToken
CREATE OR REPLACE FUNCTION _meta.get_user_authentication(i_access_token TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_authentication_data jsonb;
    v_user_authentication_id TEXT;
    
    v_query TEXT;

    v_auth_data jsonb;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    -- Check if the AccessToken is valid => This throws an error
    v_user_authentication_data := _meta.validate_access_token(i_access_token);

    v_user_authentication_id := v_user_authentication_data->>'userAuthenticationId';
    
    v_query = $tok$ SELECT row_to_json(__local_1__) "payload" FROM (SELECT ua.id, ua."userId", ua."isActive", ua."loginProviderSets", ua."modifyProviderSets", ua."invalidTokenTimestamps", ua."totalLogoutTimestamp", ua."createdAt", (SELECT COALESCE(json_agg(row_to_json(__local_2__)), '[]'::json) FROM (SELECT af.id, af."communicationAddress", af.provider, af."proofedAt", af."deletedAt", af."createdAt" FROM _meta."AuthFactor" af WHERE af."userAuthenticationId" = ua.id) __local_2__) "authFactors" FROM _meta."UserAuthentication" ua WHERE id = %L) __local_1__; $tok$;
    EXECUTE format(v_query, v_user_authentication_id) INTO v_auth_data;

    RETURN v_auth_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;