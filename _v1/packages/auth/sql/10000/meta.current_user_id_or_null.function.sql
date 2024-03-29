-- current_user_id function returns the id of the current user if the transaction_token is present and valid
CREATE OR REPLACE FUNCTION _meta.current_user_id_or_null() RETURNS uuid AS $$
DECLARE
    v_transaction_token_secret TEXT;
    v_transaction_token TEXT;
    v_parts TEXT[];
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_payload TEXT;
BEGIN
    -- Get required values from Auth-table
    SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';

    -- Read the transaction_token from local variable.
    v_transaction_token := current_setting('auth.transaction_token', true);

    -- Checks that the local variable is not null
    IF v_transaction_token IS NULL THEN
        RETURN NULL;
    END IF;

    -- Split the token into its parts.
    v_parts := regexp_split_to_array(v_transaction_token, ':');

    -- A transaction_token needs to have 3 parts
    IF array_length(v_parts, 1) != 3 THEN
    	RETURN NULL;
    END IF;

    -- Write parts into function-variables
    v_user_id := v_parts[1];
    v_timestamp := v_parts[2];
    v_signature := v_parts[3];

    -- Check if the variables are not null
    IF v_user_id IS NULL OR v_timestamp IS NULL OR v_signature IS NULL THEN
        RETURN NULL;
    END IF;

    -- Recreate the signature-payload to verify token
    v_payload := v_user_id || ':' || v_timestamp || ':' || txid_current() || v_transaction_token_secret;

    -- Hash payload and check if it matches the token-signature
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN
        -- If valid return the userId
        RETURN v_user_id::uuid;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;