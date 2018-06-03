INSERT INTO "_meta"."Auth"("key","value")
VALUES
(E'admin_token_secret',E'boss'),
(E'auth_table_schema',NULL),
(E'auth_table',NULL),
(E'auth_field_tenant',NULL),
(E'auth_field_username',NULL),
(E'auth_field_password',NULL),
(E'auth_providers',E'local:facebook:twitter'),
(E'auth_pw_secret',E'gehtdichnixan'),
(E'bf_iter_count',E'6'),
(E'pw_bf_iter_count',E'6'),
(E'transaction_token_max_age_in_seconds',E'86400'),
(E'transaction_token_secret',E'$2a$04$LY8UXcO9wVJr98HlnhAuledggz5rd4eTc9W1vsK.yEjeXA4acp5du'),
(E'transaction_token_timestamp',E'1515681282'),
(E'user_token_max_age_in_seconds',E'1209600'),
(E'user_token_secret',E'geheim'),
(E'user_token_temp_max_age_in_seconds',E'3600'),
(E'user_token_temp_secret',E'dada'),
(E'refresh_token_secret',E'ThisIsSparta')
ON CONFLICT ON CONSTRAINT "Auth_pkey" DO NOTHING;