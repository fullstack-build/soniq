-- set_user_token sets the current user for one transaction
CREATE OR REPLACE FUNCTION _meta.set_user_token(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_is_user_token_valid BOOLEAN;
    v_transaction_token_secret TEXT;
    v_transaction_token_timestamp INT;
    v_transaction_token_max_age_in_seconds INT;
    v_timestamp BIGINT;
    v_timestamp_sec INT;
    v_transaction_payload TEXT;
    v_transaction_token TEXT;
BEGIN
    -- Check if the user-token is valid. Raise exeption if not.
    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, false);
    IF v_is_user_token_valid = FALSE THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- TODO: We may could improve this to one query
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
        UPDATE "_meta"."Auth" SET "value"=crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4)) WHERE "key"='transaction_token_secret';

        -- Set transaction_token_secret to the current time to flag the secret as updated.
        UPDATE "_meta"."Auth" SET "value"=round(extract(epoch from now()))::text WHERE "key"='transaction_token_timestamp';

        -- Reload new secret for transaction usage
        SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';
    END IF;

    -- Create a transaction-token

    -- Create signature-payload from userId, timestamp, transactionId, secret
    v_transaction_payload := i_user_id || ':' || v_timestamp || ':' || txid_current() || v_transaction_token_secret;

    -- Hash signature-payload and add userId and timestamp to create a transaction_token
    v_transaction_token := i_user_id || ':' || v_timestamp || ':' || encode(digest(v_transaction_payload, 'sha256'), 'hex');

    -- Set transaction_token into a local variable, which is available it the current transaction.
    EXECUTE format('set local auth.transaction_token to %L', v_transaction_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;