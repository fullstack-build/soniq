-- is_root function checks if a user is allowed to execute other security functions like set_user and login
CREATE OR REPLACE FUNCTION _auth.is_root() RETURNS boolean AS $$
DECLARE
    v_root_token_secret TEXT;
    v_root_token TEXT;
    v_root_token_max_age_in_seconds BIGINT;
    v_parts TEXT[];
    v_tok_timestamp BIGINT;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_payload TEXT;
BEGIN
    -- Get root secret from auth-table
    SELECT value INTO v_root_token_secret FROM _auth."Settings" WHERE key = 'root_token_secret';
    SELECT value INTO v_root_token_max_age_in_seconds FROM _auth."Settings" WHERE key = 'root_token_max_age_in_seconds';

    -- Get the token set to local variable
    v_root_token := current_setting('auth.root_token', true);

    -- The setting can't be null
    IF v_root_token IS NULL THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation. Root-token required.';
    END IF;

    -- Split the token by : to get timestamp and signature
    v_parts := regexp_split_to_array(v_root_token, ':');

    -- The splitted array needs to have exact 2 parts
    IF array_length(v_parts, 1) != 2 THEN
    	RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation. Root-token required.';
    END IF;

    -- Set the token-parts to function variables
    v_tok_timestamp := v_parts[1];
    v_signature := v_parts[2];

    -- Check the token parameters
    IF v_tok_timestamp IS NULL OR v_signature IS NULL THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation. Root-token required.';
    END IF;

    -- Get the current timestamp
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    -- Check if the root-token is expired
    IF v_timestamp - v_tok_timestamp > ( v_root_token_max_age_in_seconds * 1000 ) THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation. Root-token required.';
    END IF;

    -- Create a sign-payload to check the signature
    v_payload := v_tok_timestamp || ':' || v_root_token_secret;

    -- Hash the payload to recreate the signature and check if it matches => Return true if it does
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN
        RETURN true;
    END IF;

    -- Return false if not
    RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation. Root-token required.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;