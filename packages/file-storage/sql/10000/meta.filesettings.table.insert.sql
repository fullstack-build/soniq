INSERT INTO "_meta"."FileSettings"("key","value")
VALUES
(E'max_temp_files_per_user',E'20')
ON CONFLICT ON CONSTRAINT "FileSettings_pkey" DO NOTHING;