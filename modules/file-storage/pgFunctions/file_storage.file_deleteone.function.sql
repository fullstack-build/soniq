
-- file_deleteone function deletes one file finally => for usage after deleted from bucket
CREATE OR REPLACE FUNCTION _file_storage.file_deleteone(i_file_id uuid) RETURNS SETOF _file_storage."Files" AS $$
	DELETE FROM _file_storage."Files" 
    WHERE "id" = i_file_id AND "ownerUserId" = _auth.current_user_id() AND "entityId" IS NULL AND "deletedAt" IS NOT NULL 
    RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;