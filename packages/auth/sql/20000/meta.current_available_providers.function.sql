-- current_available_providers function returns a list of providers of the current user session if the transaction_token is present and valid
CREATE OR REPLACE FUNCTION _meta.current_available_providers() RETURNS TEXT[] AS $$
DECLARE
    v_transaction_token_secret TEXT;
    v_transaction_token TEXT;
    v_parts TEXT[];
    v_user_id TEXT;
    v_provider_set TEXT;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_payload TEXT;

    v_query TEXT;
    v_available_providers TEXT[];
BEGIN
    -- Get required values from Auth-table
    SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';

    -- Read the transaction_token from local variable.
    v_transaction_token := current_setting('auth.transaction_token', true);

    -- Checks that the local variable is not null
    IF v_transaction_token IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- Split the token into its parts.
    v_parts := regexp_split_to_array(v_transaction_token, ';');

    -- A transaction_token needs to have 4 parts
    IF array_length(v_parts, 1) != 4 THEN
    	RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- Write parts into function-variables
    v_timestamp := v_parts[1];
    v_user_id := v_parts[2];
    v_provider_set := v_parts[3];
    v_signature := v_parts[4];

    -- Check if the variables are not null
    IF v_user_id IS NULL OR v_provider_set IS NULL OR v_timestamp IS NULL OR v_signature IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- Recreate the signature-payload to verify token
    v_payload := v_timestamp || ';' || v_user_id || ';' || v_provider_set || ';' || txid_current() || v_transaction_token_secret;

    -- Hash payload and check if it matches the token-signature
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN

        v_query := $tok$ SELECT ARRAY(SELECT "provider" FROM _meta."AuthFactor" WHERE "userAuthenticationId" = (SELECT "id" FROM _meta."UserAuthentication" WHERE "userId" = %L)); $tok$;
        EXECUTE format(v_query, v_user_id) INTO v_available_providers;

        return v_available_providers;
    END IF;

    -- Raise exeption because the token is not valid.
    RAISE EXCEPTION 'Session expired or token invalid.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;