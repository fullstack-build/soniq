-- get_user_pw_meta gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.get_user_pw_meta(i_username TEXT, i_provider TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_token_secret TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_username TEXT;
    v_auth_field_password TEXT;
    v_auth_field_tenant TEXT;
    v_pw_meta jsonb;
    v_query TEXT;
    v_user_id TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    -- TODO: We may want to rewrite this queries into one query
    -- Get required values from Auth-table
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_tenant FROM _meta."Auth" WHERE key = 'auth_field_tenant';

    -- Find the userId and password-metas by username, provider (and when defined tenant)
    IF v_auth_field_tenant IS NULL THEN
        v_query := $tok$SELECT %I->'providers'->%L->'meta', id FROM %I.%I WHERE %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username) INTO v_pw_meta, v_user_id;
    ELSE
        v_query := $tok$SELECT %I->'providers'->%L->'meta', id FROM %I.%I WHERE %I = %L AND %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username, v_auth_field_tenant, i_tenant) INTO v_pw_meta, v_user_id;
    END IF;

    -- If userId or pwMetas is null something is wrong
    IF v_user_id IS NULL OR v_pw_meta IS NULL THEN
        RAISE EXCEPTION 'User or provider not found!';
    END IF;

    -- Return the data as jsonb object
    RETURN jsonb_build_object('userId', v_user_id, 'pwMeta', v_pw_meta);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
