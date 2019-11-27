-- current_user_get_communication_address function checks if a user has a proofed AuthFactor with the given provider-name
CREATE OR REPLACE FUNCTION _auth.get_communication_address_if_proofed(i_user_id uuid, i_provider TEXT) RETURNS TEXT AS $$
DECLARE
    v_query TEXT;
    v_communication_address TEXT;
BEGIN
    v_query := $tok$ SELECT COALESCE((SELECT "communicationAddress" FROM _auth."AuthFactor" WHERE "deletedAt" IS NULL AND "proofedAt" IS NOT NULL AND "userAuthenticationId" = (SELECT "id" FROM _auth."UserAuthentication" WHERE "userId" = %L) AND "provider" = %L), NULL); $tok$;
    EXECUTE format(v_query, i_user_id, i_provider) INTO v_communication_address;

    return v_communication_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;