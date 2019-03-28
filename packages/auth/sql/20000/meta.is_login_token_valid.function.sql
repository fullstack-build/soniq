-- validate_login_token function validates the login-token and returns the userAuthenticationId
CREATE OR REPLACE FUNCTION _meta.validate_login_token(i_login_token TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_login_token_array TEXT[];
    v_issued_at BIGINT;
    v_auth_factor_ids TEXT[];
    v_input_login_token_signature TEXT;

    v_auth_factor_hashes TEXT[];
    v_provider_set_array TEXT[];
    v_provider_set TEXT;
    v_timestamp BIGINT;

    v_auth_factor_id TEXT;
    v_query TEXT;
    v_user_authentication_id TEXT;
    v_auth_factor_hash TEXT;
    v_auth_factor_provider TEXT;

    v_login_token_secret TEXT;
    v_login_token_max_age_in_seconds INT;
    v_login_token_payload TEXT;
    v_login_token_signature TEXT;

    v_user_id TEXT;
    v_user_authentication_active BOOLEAN;
    v_invalid_token_timestamps BIGINT[];
    v_total_logout_timestamp BIGINT;
    v_invalid_token_position INT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
    
    v_login_token_array := string_to_array(i_login_token, ';');

    IF array_length(v_login_token_array, 1) != 3 THEN
      RAISE EXCEPTION 'Invalid LoginToken.';
    END IF;

    v_issued_at := v_login_token_array[1];
    v_auth_factor_ids := string_to_array(v_login_token_array[2], ':');
    v_input_login_token_signature := v_login_token_array[3];

    SELECT value INTO v_login_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'login_token_max_age_in_seconds';

    -- Get current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Check if token is expired
    IF v_timestamp - v_issued_at > (v_login_token_max_age_in_seconds * 1000) THEN
        RAISE EXCEPTION 'LoginToken expired.';
    END IF;

    FOREACH v_auth_factor_id IN ARRAY v_auth_factor_ids
    LOOP
      v_query := $tok$ SELECT "userAuthenticationId", "hash", "provider" FROM "_meta"."AuthFactor" WHERE "id" = %L $tok$;
      EXECUTE format(v_query, v_auth_factor_id) INTO v_user_authentication_id, v_auth_factor_hash, v_auth_factor_provider;  

      v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
      v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;

    SELECT value INTO v_login_token_secret FROM _meta."Auth" WHERE key = 'login_token_secret';
  
    -- Build the payload of login-token signature
    v_login_token_payload := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || array_to_string(v_auth_factor_hashes, ':') || ';' || v_login_token_secret;
  
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_login_token_signature := crypt(encode(digest(v_login_token_payload, 'sha256'), 'hex'), v_input_login_token_signature);

    IF v_login_token_signature != v_input_login_token_signature THEN
      RAISE EXCEPTION 'Signature invalid.';
    END IF;

    v_query := $tok$ SELECT "userId", "isActive", "invalidTokenTimestamps", "totalLogoutTimestamp" FROM "_meta"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_user_authentication_id) INTO v_user_id, v_user_authentication_active, v_invalid_token_timestamps, v_total_logout_timestamp;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'UserAuthentication inactive.';
    END IF;

    -- Check if the token is issued before the totalLogoutTimestamp. If yes it is invalid.
    IF v_total_logout_timestamp >= v_issued_at THEN
      RAISE EXCEPTION 'This token has been invalidated. (TOTAL)';
    END IF;

    -- Get the position of the token-timestamp in the invalidTimestamps array
    v_invalid_token_position := array_position(v_invalid_token_timestamps, v_issued_at);

    -- If the position is not null, the token-timestamp is in the list and thereby invalid.
    IF v_invalid_token_position IS NOT NULL THEN
      RAISE EXCEPTION 'This token has been invalidated.';
    END IF;

    v_provider_set_array := _meta.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');

    RETURN jsonb_build_object('userAuthenticationId', v_user_authentication_id, 'providerSet', v_provider_set, 'userId', v_user_id, 'issuedAt', v_issued_at, 'authFactorIds', v_auth_factor_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;