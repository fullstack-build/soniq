-- file_clean function returns the id of a new file with a certain ending
CREATE OR REPLACE FUNCTION _meta.file_clean() RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := _meta.current_user_id();

    EXECUTE format('DELETE FROM _meta."Files" WHERE "ownerUserId" = %L AND "entityId" IS NULL;', v_user_id);
END;
$$ LANGUAGE plpgsql;