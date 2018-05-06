CREATE TABLE IF NOT EXISTS "_meta"."FileSettings" (
    "key" varchar NOT NULL,
    "value" varchar,
    PRIMARY KEY ("key")
);
INSERT INTO "_meta"."FileSettings"("key","value")
VALUES
(E'max_temp_files_per_user',E'20')
ON CONFLICT ON CONSTRAINT "FileSettings_pkey" DO NOTHING;