-- authenticate_transaction function sets a session for the current transaction
CREATE OR REPLACE FUNCTION _auth.authenticate_transaction(i_access_token TEXT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_authentication_data jsonb;
    v_user_id TEXT;
    v_provider_set TEXT;
    
    v_query TEXT;

    v_transaction_token_secret TEXT;
    v_transaction_token_timestamp INT;
    v_transaction_token_max_age_in_seconds INT;
    v_timestamp BIGINT;
    v_timestamp_sec INT;
    v_transaction_payload TEXT;
    v_transaction_token TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    -- Check if the AccessToken is valid => This throws an error
    v_user_authentication_data := _auth.validate_access_token(i_access_token);
    
    v_user_id := v_user_authentication_data->>'userId';
    v_provider_set := v_user_authentication_data->>'providerSet';
    
    -- TODO: We may want to rewrite this queries into one query
    -- Get required values from Auth-table
    SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';
    SELECT value INTO v_transaction_token_timestamp FROM _meta."Auth" WHERE key = 'transaction_token_timestamp';
    SELECT value INTO v_transaction_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'transaction_token_max_age_in_seconds';

    -- Get current time in seconds and milliseconds
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;
    v_timestamp_sec := round(extract(epoch from now()))::int;

    -- Check if the transaction_token_secret needs to get renewed.
    IF (v_timestamp_sec - v_transaction_token_timestamp) > v_transaction_token_max_age_in_seconds THEN
        -- Create a new random transaction_token_secret.
        UPDATE _meta."Auth" SET "value"=crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4)) WHERE "key"='transaction_token_secret';

        -- Set transaction_token_secret to the current time to flag the secret as updated.
        UPDATE _meta."Auth" SET "value"=round(extract(epoch from now()))::text WHERE "key"='transaction_token_timestamp';

        -- Reload new secret for transaction usage
        SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';
    END IF;

    -- Create a transaction-token

    -- Create signature-payload from userId, timestamp, transactionId, secret
    v_transaction_payload := v_timestamp || ';' || v_user_id || ';' || v_provider_set || ';' || txid_current() || v_transaction_token_secret;

    -- Hash signature-payload and add userId and timestamp to create a transaction_token
    v_transaction_token := v_timestamp || ';' || v_user_id || ';' || v_provider_set || ';' || encode(digest(v_transaction_payload, 'sha256'), 'hex');

    -- Set transaction_token into a local variable, which is available it the current transaction.
    EXECUTE format('set local auth.transaction_token to %L', v_transaction_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;