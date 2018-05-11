
-- file_clearupone function deletes one temporary file which has not been added to an entity
CREATE OR REPLACE FUNCTION _meta.file_clearupone(i_file_id uuid) RETURNS SETOF _meta."Files" AS $$
	UPDATE _meta."Files" SET "deletedAt"=now() 
    WHERE "id" = i_file_id AND "ownerUserId" = _meta.current_user_id() AND "entityId" IS NULL AND "deletedAt" IS NULL 
    RETURNING *;
$$ LANGUAGE sql;