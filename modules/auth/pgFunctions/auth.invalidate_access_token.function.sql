-- invalidate_access_token invalidates the token of the current user session
CREATE OR REPLACE FUNCTION _auth.invalidate_access_token(i_access_token TEXT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_authentication_data jsonb;
    v_user_authentication_id TEXT;
    v_issued_at BIGINT;

    v_query TEXT;
    v_access_token_max_age_in_seconds BIGINT;
    v_invalid_token_timestamps BIGINT[];

    v_timestamps_to_clear BIGINT[];
    v_timestamp BIGINT;
    v_timestamp_now BIGINT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    -- Check if the AccessToken is valid => This throws an error
    v_user_authentication_data := _auth.validate_access_token(i_access_token);

    v_user_authentication_id := v_user_authentication_data->>'userAuthenticationId';
    v_issued_at := v_user_authentication_data->>'issuedAt';

    SELECT value INTO v_access_token_max_age_in_seconds FROM _auth."Settings" WHERE key = 'access_token_max_age_in_seconds';

    v_query := $tok$ SELECT "invalidTokenTimestamps" FROM "_auth"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_user_authentication_id) INTO v_invalid_token_timestamps;

    -- Initialise variables
    v_timestamp_now := (round(extract(epoch from now())*1000))::bigint;
    v_timestamps_to_clear := ARRAY[]::BIGINT[];

    -- Find token-timestamps in invalidTokens, which are expired anyway by the double of expiration time.
    FOREACH v_timestamp IN ARRAY v_invalid_token_timestamps
    LOOP
        IF v_timestamp_now - v_timestamp > (v_access_token_max_age_in_seconds * 1000 * 2) THEN
            v_timestamps_to_clear := array_append(v_timestamps_to_clear, v_timestamp);
        END IF;
    END LOOP;

    -- Remove token-timestamps from invalidTokens, which are expired anyway.
    FOREACH v_timestamp IN ARRAY v_timestamps_to_clear
    LOOP
        v_invalid_token_timestamps := array_remove(v_invalid_token_timestamps, v_timestamp);
    END LOOP;

    -- append current timestamp to invalidate it
    v_invalid_token_timestamps := array_append(v_invalid_token_timestamps, v_issued_at);

    -- Get password-field and userId from user by userId
    v_query := $tok$ UPDATE "_auth"."UserAuthentication" SET "invalidTokenTimestamps" = %L WHERE "id" = %L; $tok$;
    EXECUTE format(v_query, v_invalid_token_timestamps, v_user_authentication_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;