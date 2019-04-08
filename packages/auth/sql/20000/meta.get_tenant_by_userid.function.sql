-- get_tenant_by_userid function returns the tenant
CREATE OR REPLACE FUNCTION _meta.get_tenant_by_userid(i_user_id TEXT) RETURNS TEXT AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_get_tenant_by_user_id_query TEXT;
    v_tenant TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

    -- Get required values from Auth-table
    SELECT value INTO v_get_tenant_by_user_id_query FROM _meta."Auth" WHERE key = 'get_tenant_by_user_id_query';

    EXECUTE format(v_get_tenant_by_user_id_query, i_user_id) INTO v_tenant;

    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: The tenant is null or user not found.';
    END IF;

    RETURN v_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;