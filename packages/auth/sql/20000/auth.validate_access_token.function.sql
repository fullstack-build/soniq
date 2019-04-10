-- validate_access_token function validates the access-token and returns the userAuthenticationId
CREATE OR REPLACE FUNCTION _auth.validate_access_token(i_access_token TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_access_token_array TEXT[];
    v_issued_at BIGINT;
    v_auth_factor_ids TEXT[];
    v_input_access_token_signature TEXT;

    v_auth_factor_hashes TEXT[];
    v_provider_set_array TEXT[];
    v_provider_set TEXT;
    v_timestamp BIGINT;

    v_auth_factor_id TEXT;
    v_query TEXT;
    v_user_authentication_id TEXT;
    v_auth_factor_hash TEXT;
    v_auth_factor_provider TEXT;

    v_access_token_secret TEXT;
    v_access_token_max_age_in_seconds INT;
    v_access_token_payload TEXT;
    v_access_token_signature TEXT;

    v_user_id TEXT;
    v_user_authentication_active BOOLEAN;
    v_invalid_token_timestamps BIGINT[];
    v_total_logout_timestamp BIGINT;
    v_invalid_token_position INT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    v_access_token_array := string_to_array(i_access_token, ';');

    IF array_length(v_access_token_array, 1) != 3 THEN
      RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: Invalid AccessToken.';
    END IF;

    v_issued_at := v_access_token_array[1];
    v_auth_factor_ids := string_to_array(v_access_token_array[2], ':');
    v_input_access_token_signature := v_access_token_array[3];

    SELECT value INTO v_access_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'access_token_max_age_in_seconds';

    -- Get current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Check if token is expired
    IF v_timestamp - v_issued_at > (v_access_token_max_age_in_seconds * 1000) THEN
        RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: AccessToken expired.';
    END IF;

    FOREACH v_auth_factor_id IN ARRAY v_auth_factor_ids
    LOOP
      v_query := $tok$ SELECT "userAuthenticationId", "hash", "provider" FROM "_auth"."AuthFactor" WHERE "id" = %L AND "deletedAt" IS NULL; $tok$;
      EXECUTE format(v_query, v_auth_factor_id) INTO v_user_authentication_id, v_auth_factor_hash, v_auth_factor_provider;

      -- Check if anything is NULL
      IF v_user_authentication_id IS NULL OR v_auth_factor_hash IS NULL OR v_auth_factor_provider IS NULL THEN
          RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: AuthFactor invalid.';
      END IF;

      v_auth_factor_hashes := array_append(v_auth_factor_hashes, v_auth_factor_hash);
      v_provider_set_array := array_append(v_provider_set_array, v_auth_factor_provider);
    END LOOP;

    SELECT value INTO v_access_token_secret FROM _meta."Auth" WHERE key = 'access_token_secret';
  
    -- Build the payload of access-token signature
    v_access_token_payload := v_issued_at || ';' || array_to_string(v_auth_factor_ids, ':') || ';' || array_to_string(v_auth_factor_hashes, ':') || ';' || v_access_token_secret;
  
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_access_token_signature := crypt(encode(digest(v_access_token_payload, 'sha256'), 'hex'), v_input_access_token_signature);

    IF v_access_token_signature != v_input_access_token_signature THEN
      RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: Signature invalid.';
    END IF;

    v_query := $tok$ SELECT "userId", "isActive", "invalidTokenTimestamps", "totalLogoutTimestamp" FROM "_auth"."UserAuthentication" WHERE "id" = %L $tok$;
    EXECUTE format(v_query, v_user_authentication_id) INTO v_user_id, v_user_authentication_active, v_invalid_token_timestamps, v_total_logout_timestamp;

    IF v_user_authentication_active IS NOT TRUE THEN
      RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: UserAuthentication inactive.';
    END IF;

    -- Check if the token is issued before the totalLogoutTimestamp. If yes it is invalid.
    IF v_total_logout_timestamp >= v_issued_at THEN
      RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: This token has been invalidated. (TOTAL)';
    END IF;

    -- Get the position of the token-timestamp in the invalidTimestamps array
    v_invalid_token_position := array_position(v_invalid_token_timestamps, v_issued_at);

    -- If the position is not null, the token-timestamp is in the list and thereby invalid.
    IF v_invalid_token_position IS NOT NULL THEN
      RAISE EXCEPTION 'AUTH.THROW.AUTHENTICATION_ERROR: This token has been invalidated.';
    END IF;

    v_provider_set_array := _auth.array_sort(v_provider_set_array);
    v_provider_set := array_to_string(v_provider_set_array, ':');

    RETURN jsonb_build_object('userAuthenticationId', v_user_authentication_id, 'providerSet', v_provider_set, 'userId', v_user_id, 'issuedAt', v_issued_at, 'authFactorIds', v_auth_factor_ids, 'accessTokenMaxAgeInSeconds', v_access_token_max_age_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;