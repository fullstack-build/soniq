
-- file_deleteone function deletes one file finally => for usage after deleted from bucket
CREATE OR REPLACE FUNCTION _meta.file_deleteone(i_file_id uuid) RETURNS SETOF _meta."Files" AS $$
	DELETE FROM _meta."Files" 
    WHERE "id" = i_file_id AND "ownerUserId" = _auth.current_user_id() AND "entityId" IS NULL AND "deletedAt" IS NOT NULL 
    RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;