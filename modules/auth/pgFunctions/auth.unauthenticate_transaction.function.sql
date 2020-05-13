-- unauthenticate_transaction function resets a session for the current transaction
CREATE OR REPLACE FUNCTION _auth.unauthenticate_transaction() RETURNS void AS $$
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

    -- Reset transaction_token
    EXECUTE format('RESET auth.transaction_token;');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;