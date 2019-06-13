-- set_admin function sets a local for admin functions
CREATE OR REPLACE FUNCTION _auth.set_admin(i_admin_token_secret TEXT) RETURNS void AS $$
DECLARE
    v_timestamp BIGINT;
    v_payload TEXT;
    v_admin_token TEXT;
BEGIN
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_payload := v_timestamp || ':' || i_admin_token_secret;

    v_admin_token := v_timestamp || ':' || encode(digest(v_payload, 'sha256'), 'hex');

    EXECUTE format('set local auth.admin_token to %L', v_admin_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;