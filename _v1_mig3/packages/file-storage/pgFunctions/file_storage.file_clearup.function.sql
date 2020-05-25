
-- file_clearupone function deletes all temporary files of a user which have not been added to an entity
CREATE OR REPLACE FUNCTION _file_storage.file_clearup() RETURNS SETOF _file_storage."Files" AS $$
	UPDATE _file_storage."Files" SET "deletedAt"=now() 
    WHERE "ownerUserId" = _auth.current_user_id() AND "entityId" IS NULL AND "deletedAt" IS NULL 
    RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;