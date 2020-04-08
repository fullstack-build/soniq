
CREATE OR REPLACE FUNCTION _meta.get_last_generated_uuid() RETURNS uuid AS $$
DECLARE
    v_new_uuid TEXT;
BEGIN

    v_new_uuid := current_setting('temp.new_uuid', true);

    -- Checks that the local variable is not null
    IF v_new_uuid IS NULL OR length(v_new_uuid) < 36 THEN
        RAISE EXCEPTION 'No uuid has been generated in this transaction.';
    END IF;
    
    return v_new_uuid::uuid;
END;
$$ LANGUAGE plpgsql;