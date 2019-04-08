-- invalidate_all_access_tokens invalidates tokens of the current user ever created before the current time
CREATE OR REPLACE FUNCTION _meta.invalidate_all_access_tokens(i_access_token TEXT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_authentication_data jsonb;
    v_user_authentication_id TEXT;
    
    v_query TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
	  v_is_admin := _meta.is_admin();
	  IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    -- Check if the AccessToken is valid => This throws an error
    v_user_authentication_data := _meta.validate_access_token(i_access_token);
    
    v_user_authentication_id := v_user_authentication_data->>'userAuthenticationId';

    -- Set invalidTokenTimestamps to empty array and totalLogourTimestamp to now
    v_query := $tok$ UPDATE "_meta"."UserAuthentication" SET "invalidTokenTimestamps" = ARRAY[]::BIGINT[], "totalLogoutTimestamp" = (round(extract(epoch from now())*1000))::bigint WHERE "id" = %L; $tok$;
    EXECUTE format(v_query, v_user_authentication_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;