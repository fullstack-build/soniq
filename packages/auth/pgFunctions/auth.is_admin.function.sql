-- is_admin function checks if a user is allowed to execute other security functions like set_user and login
CREATE OR REPLACE FUNCTION _auth.is_admin() RETURNS boolean AS $$
DECLARE
    v_admin_token_secret TEXT;
    v_admin_token TEXT;
    v_parts TEXT[];
    v_tok_timestamp BIGINT;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_payload TEXT;
BEGIN
    -- Get admin secret from auth-table
    SELECT value INTO v_admin_token_secret FROM _auth."Settings" WHERE key = 'admin_token_secret';

    -- Get the token set to local variable
    v_admin_token := current_setting('auth.admin_token', true);

    -- The setting can't be null
    IF v_admin_token IS NULL THEN
        RETURN false;
    END IF;

    -- Split the token by : to get timestamp and signature
    v_parts := regexp_split_to_array(v_admin_token, ':');

    -- The splitted array needs to have exact 2 parts
    IF array_length(v_parts, 1) != 2 THEN
    	RETURN false;
    END IF;

    -- Set the token-parts to function variables
    v_tok_timestamp := v_parts[1];
    v_signature := v_parts[2];

    -- Check the token parameters
    IF v_tok_timestamp IS NULL OR v_signature IS NULL THEN
        RETURN false;
    END IF;

    -- Get the current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Check if the admin-token is expired
    IF v_timestamp - v_tok_timestamp > 60000 THEN
        RETURN false;
    END IF;

    -- Create a sign-payload to check the signature
    v_payload := v_tok_timestamp || ':' || v_admin_token_secret;

    -- Hash the payload to recreate the signature and check if it matches => Return true if it does
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN
        RETURN true;
    END IF;

    -- Return false if not
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;