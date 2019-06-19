INSERT INTO "_meta"."info"("key", "value") VALUES('version', '10000')
ON CONFLICT ("key") DO UPDATE SET "value" = '10000';
