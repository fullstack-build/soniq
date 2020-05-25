
CREATE OR REPLACE FUNCTION _graphql_meta.uuid_generate_v4() RETURNS uuid AS $$
DECLARE
    v_new_uuid uuid;
BEGIN
    v_new_uuid := uuid_generate_v4();

    EXECUTE format('set local temp.new_uuid to %L', v_new_uuid);
    
    return v_new_uuid;
END;
$$ LANGUAGE plpgsql;