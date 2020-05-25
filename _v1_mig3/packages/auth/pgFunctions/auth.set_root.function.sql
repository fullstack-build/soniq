-- set_root function sets a local for root functions
CREATE OR REPLACE FUNCTION _auth.set_root(i_root_token_secret TEXT) RETURNS void AS $$
DECLARE
    v_timestamp BIGINT;
    v_payload TEXT;
    v_root_token TEXT;
BEGIN
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_payload := v_timestamp || ':' || i_root_token_secret;

    v_root_token := v_timestamp || ':' || encode(digest(v_payload, 'sha256'), 'hex');

    EXECUTE format('set local auth.root_token to %L', v_root_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;