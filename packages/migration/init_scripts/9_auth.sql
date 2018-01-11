
CREATE TABLE "_meta"."Auth" (
    "key" varchar,
    "value" varchar,
    PRIMARY KEY ("key")
);

INSERT INTO "_meta"."Auth"("key","value")
VALUES
(E'admin_token_secret',E'boss'),
(E'auth_field_password',E'password'),
(E'auth_field_tenant',NULL),
(E'auth_field_username',E'email'),
(E'auth_providers',E'password:facebook:twitter'),
(E'auth_pw_secret',E'gehtdichnixan'),
(E'auth_table',E'User'),
(E'auth_table_schema',E'public'),
(E'bf_iter_count',E'6'),
(E'pw_bf_iter_count',E'6'),
(E'transaction_token_max_age_in_seconds',E'86400'),
(E'transaction_token_secret',E'$2a$04$LY8UXcO9wVJr98HlnhAuledggz5rd4eTc9W1vsK.yEjeXA4acp5du'),
(E'transaction_token_timestamp',E'1515681282'),
(E'user_token_max_age_in_seconds',E'1209600'),
(E'user_token_secret',E'geheim'),
(E'user_token_temp_max_age_in_seconds',E'3600'),
(E'user_token_temp_secret',E'dada');


-- set local auth.admin_token to '1515332430747:f62c0c0a744ed5103d370fae033085bf0c8dbd4ff6bf7247e359c21eff2e2235';

-- SELECT is_admin();

-- SELECT extract(epoch from now())*1000::bigint;

-- is_admin function checks if a user is allowed to execute other security functions like set_user and login
CREATE OR REPLACE FUNCTION _meta.is_admin() RETURNS boolean AS $$
DECLARE
    v_admin_token_secret TEXT;
    v_admin_token TEXT;
    v_parts TEXT[];
    v_tok_timestamp BIGINT;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_payload TEXT;
BEGIN
    SELECT value INTO v_admin_token_secret FROM _meta."Auth" WHERE key = 'admin_token_secret';

    v_admin_token := current_setting('auth.admin_token', true);

    IF v_admin_token IS NULL THEN
        RETURN false;
    END IF;
    
    v_parts := regexp_split_to_array(v_admin_token, ':');
    
    IF array_length(v_parts, 1) != 2 THEN
    	RETURN false;
    END IF;
    
    v_tok_timestamp := v_parts[1];
    v_signature := v_parts[2];

    IF v_tok_timestamp IS NULL OR v_signature IS NULL THEN
        RETURN false;
    END IF;

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    IF v_timestamp - v_tok_timestamp > 60000 THEN
        RETURN false;
    END IF;
    
    v_payload := v_tok_timestamp || ':' || v_admin_token_secret;
  
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- get_user_pw_meta gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.get_user_pw_meta(i_username TEXT, i_provider TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_token_secret TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_username TEXT;
    v_auth_field_password TEXT;
    v_auth_field_tenant TEXT;
    v_pw_meta jsonb;
    v_query TEXT;
    v_user_id TEXT;
BEGIN
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
  
    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_tenant FROM _meta."Auth" WHERE key = 'auth_field_tenant';
    
    IF v_auth_field_tenant IS NULL THEN
        v_query := $tok$SELECT %I->'providers'->%L->'meta', id FROM %I.%I WHERE %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username) INTO v_pw_meta, v_user_id;
    ELSE
        v_query := $tok$SELECT %I->'providers'->%L->'meta', id FROM %I.%I WHERE %I = %L AND %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username, v_auth_field_tenant, i_tenant) INTO v_pw_meta, v_user_id;
    END IF;

    IF v_user_id IS NULL OR v_pw_meta IS NULL THEN
        RAISE EXCEPTION 'User or provider not found!';
    END IF;
        
    RETURN jsonb_build_object('userId', v_user_id, 'pwMeta', v_pw_meta);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;



-- login returns a user token and other data required for the jwt token if the hash matches
CREATE OR REPLACE FUNCTION _meta.login(i_user_id TEXT, i_provider TEXT, i_pw_hash TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_user_token_secret TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_auth_pw_secret TEXT;
    v_bf_iter_count INT;
    v_query TEXT;
    v_pw_hash TEXT;
    v_pw_hash_check TEXT;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_user_token TEXT;
BEGIN
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
  
    -- TODO: We may could improve this to one query
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_pw_secret FROM _meta."Auth" WHERE key = 'auth_pw_secret';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';

    v_query := $tok$SELECT %I->'providers'->%L->>'hash', id FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw_hash, v_user_id;

    IF v_pw_hash IS NULL OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Login failed!';
    END IF;

    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_pw_hash_check := crypt(encode(digest(i_pw_hash || v_auth_pw_secret, 'sha256'), 'hex'), v_pw_hash);

    IF v_pw_hash != v_pw_hash_check THEN
        RAISE EXCEPTION 'Login failed!';
    END IF;
    
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;
    
    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));
        
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', v_user_id, 'provider', i_provider,'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_max_age_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- is_user_token_valid checks the user_token and returns true/false 
CREATE OR REPLACE FUNCTION _meta.is_user_token_valid(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT, i_temp_token BOOLEAN, i_temp_max_age BOOLEAN) RETURNS boolean AS $$
DECLARE
    v_user_token_secret TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_query TEXT;
    v_pw_hash TEXT;
    v_user_id TEXT;
    v_total_logout BIGINT;
    v_invalid_tokens TEXT[];
    v_invalid_token_position INT;
    v_timestamp BIGINT;
    v_timestamp_sec INT;
    v_payload TEXT;
    v_user_token TEXT;
BEGIN
    IF i_temp_token = true THEN
        SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_temp_secret';
    ELSE
        SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    END IF;

    IF i_temp_max_age = true THEN
        SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_temp_max_age_in_seconds';
    ELSE
        SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    END IF;
    
    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    IF v_timestamp - i_timestamp > (v_user_token_max_age_in_seconds * 1000) THEN
        RETURN false;
    END IF;
    
    v_query := $tok$SELECT %I->'providers'->%L->>'hash', id, %I->>'totalLogoutTimestamp', ARRAY(SELECT jsonb_array_elements_text(%I->'invalidTokens')) FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, i_provider, v_auth_field_password, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw_hash, v_user_id, v_total_logout, v_invalid_tokens;
    
    IF v_pw_hash IS NULL OR v_user_id IS NULL OR v_total_logout IS NULL OR v_invalid_tokens IS NULL THEN
        RETURN false;
    END IF;

    IF v_total_logout >= i_timestamp THEN
        RETURN false;
    END IF;

    v_invalid_token_position := array_position(v_invalid_tokens, i_timestamp::text);

    IF v_invalid_token_position IS NOT NULL THEN
        RETURN false;
    END IF;
    
    v_payload := v_pw_hash || ':' || i_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), i_user_token);

    IF i_user_token != v_user_token THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- set_user_token sets the current user for one transaction
CREATE OR REPLACE FUNCTION _meta.set_user_token(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_is_user_token_valid BOOLEAN;
    v_transaction_token_secret TEXT;
    v_transaction_token_timestamp INT;
    v_transaction_token_max_age_in_seconds INT;
    v_timestamp BIGINT;
    v_timestamp_sec INT;
    v_transaction_payload TEXT;
    v_transaction_token TEXT;
BEGIN
    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, false);
    IF v_is_user_token_valid = FALSE THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    -- TODO: We may could improve this to one query
    SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';
    SELECT value INTO v_transaction_token_timestamp FROM _meta."Auth" WHERE key = 'transaction_token_timestamp';
    SELECT value INTO v_transaction_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'transaction_token_max_age_in_seconds';
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;
    v_timestamp_sec := round(extract(epoch from now()))::int;

    IF (v_timestamp_sec - v_transaction_token_timestamp) > v_transaction_token_max_age_in_seconds THEN
        UPDATE "_meta"."Auth" SET "value"=crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4)) WHERE "key"='transaction_token_secret';
        UPDATE "_meta"."Auth" SET "value"=round(extract(epoch from now()))::text WHERE "key"='transaction_token_timestamp';
    END IF;

    v_transaction_payload := i_user_id || ':' || v_timestamp || ':' || txid_current() || v_transaction_token_secret;

    v_transaction_token := i_user_id || ':' || v_timestamp || ':' || encode(digest(v_transaction_payload, 'sha256'), 'hex');
    
    EXECUTE format('set local auth.transaction_token to %L', v_transaction_token);
END;
$$ LANGUAGE plpgsql;

-- current_user_id function returns the id of the current user if the transaction_token is present and valid
CREATE OR REPLACE FUNCTION _meta.current_user_id() RETURNS uuid AS $$
DECLARE
    v_transaction_token_secret TEXT;
    v_transaction_token TEXT;
    v_parts TEXT[];
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_payload TEXT;
BEGIN
    SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';

    v_transaction_token := current_setting('auth.transaction_token', true);

    IF v_transaction_token IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    
    v_parts := regexp_split_to_array(v_transaction_token, ':');
    
    IF array_length(v_parts, 1) != 3 THEN
    	RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    
    v_user_id := v_parts[1];
    v_timestamp := v_parts[2];
    v_signature := v_parts[3];

    IF v_user_id IS NULL OR v_timestamp IS NULL OR v_signature IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    
    v_payload := v_user_id || ':' || v_timestamp || ':' || txid_current() || v_transaction_token_secret;
  
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN
        RETURN v_user_id::uuid;
    END IF;
    
    RAISE EXCEPTION 'Session expired or token invalid.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- invalidate_user_token invalidates the current token, nothing else
CREATE OR REPLACE FUNCTION _meta.invalidate_user_token(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_query TEXT;
    v_invalid_tokens BIGINT[];
    v_user_id TEXT;
    v_password jsonb;
    v_timestamp BIGINT;
    v_counter INT;
    v_ts_to_clear BIGINT[];
    v_new_pw TEXT;
    i BIGINT;
    v_max INT;
BEGIN
	v_is_admin := _meta.is_admin();
	IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, false);
    IF v_is_user_token_valid = FALSE THEN
        RETURN;
    END IF;

    -- TODO: We may could improve this to one query
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_query := $tok$SELECT id, %I, ARRAY(SELECT jsonb_array_elements_text(%I->'invalidTokens')) FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password, v_invalid_tokens;
    
    IF v_user_id IS NULL OR v_password IS NULL OR v_invalid_tokens IS NULL THEN
        RAISE EXCEPTION 'Invalidation failed!';
    END IF;

    v_ts_to_clear := ARRAY[]::BIGINT[];
    v_counter := 0;
    v_max := array_length(v_invalid_tokens, 1) + 1;

    LOOP 
        EXIT WHEN v_max IS NULL OR v_counter >= v_max; 
        v_counter := v_counter + 1;
        IF v_timestamp - v_invalid_tokens[v_counter]::bigint > (v_user_token_max_age_in_seconds * 1000) THEN
            v_ts_to_clear := array_append(v_ts_to_clear, v_invalid_tokens[v_counter]);
        END IF;
    END LOOP;

    FOREACH i IN ARRAY v_ts_to_clear
    LOOP 
        v_invalid_tokens := array_remove(v_invalid_tokens, i);
    END LOOP;

    v_invalid_tokens := array_append(v_invalid_tokens, i_timestamp::bigint);

    v_password := jsonb_set(v_password, ARRAY['invalidTokens'], to_jsonb(v_invalid_tokens));

    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);
END;
$$ LANGUAGE plpgsql;

-- invalidate_all_user_tokens invalidates the current token, nothing else
CREATE OR REPLACE FUNCTION _meta.invalidate_all_user_tokens(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_query TEXT;
    v_invalid_tokens BIGINT[];
    v_user_id TEXT;
    v_password jsonb;
    v_timestamp BIGINT;
BEGIN
	v_is_admin := _meta.is_admin();
	IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, false);
    IF v_is_user_token_valid = FALSE THEN
        RETURN;
    END IF;

    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';

    v_query := $tok$SELECT id, %I FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password;
    
    IF v_user_id IS NULL OR v_password IS NULL THEN
        RAISE EXCEPTION 'Invalidation failed!';
    END IF;

    v_invalid_tokens := ARRAY[]::BIGINT[];

    v_password := jsonb_set(v_password, ARRAY['invalidTokens'], to_jsonb(v_invalid_tokens));

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_password := jsonb_set(v_password, ARRAY['totalLogoutTimestamp'], to_jsonb(v_timestamp));

    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);
END;
$$ LANGUAGE plpgsql;

-- get_user_auth_data gets all data required by node login procedure
-- get_user_auth_data gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.register_user(i_username TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin   BOOLEAN;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_username   TEXT;
    v_auth_field_password   TEXT;
    v_auth_field_tenant   TEXT;
    v_user_token_temp_secret TEXT;
    v_user_token_temp_max_age_in_seconds BIGINT;
    v_pw_bf_iter_count Int;
    v_bf_iter_count Int;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_random_pw TEXT;
    v_pw_hash TEXT;
    v_meta jsonb;
    v_providers jsonb;
    v_password jsonb;
    v_payload TEXT;
    v_user_token TEXT;
BEGIN
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
  
    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_tenant FROM _meta."Auth" WHERE key = 'auth_field_tenant';
    SELECT value INTO v_user_token_temp_secret FROM _meta."Auth" WHERE key = 'user_token_temp_secret';
    SELECT value INTO v_user_token_temp_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_temp_max_age_in_seconds';
    SELECT value INTO v_pw_bf_iter_count FROM _meta."Auth" WHERE key = 'pw_bf_iter_count';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_random_pw = crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 6));

    v_pw_hash := crypt(encode(digest(v_random_pw, 'sha256'), 'hex'), gen_salt('bf', v_pw_bf_iter_count));

    v_meta := jsonb_build_object('salt', encode(gen_random_bytes(16), 'hex'), 'memlimit', 67108864, 'opslimit', 2, 'algorithm', 2, 'hashBytes', 128);

    v_providers := jsonb_build_object('password', jsonb_build_object('hash', v_pw_hash, 'meta', v_meta));

    v_password := jsonb_build_object('providers', v_providers, 'totalLogoutTimeout', 0, 'invalidTokens', to_jsonb(ARRAY[]::BIGINT[]));
    
    IF v_auth_field_tenant IS NULL THEN
        EXECUTE format('INSERT INTO %I.%I(%I, %I) VALUES(%L, %L) RETURNING id', v_auth_table_schema, v_auth_table, v_auth_field_username, v_auth_field_password, i_username, v_password) INTO v_user_id;
    ELSE
        EXECUTE format('INSERT INTO %I.%I(%I, %I, %I) VALUES(%L, %L, %L) RETURNING id', v_auth_table_schema, v_auth_table, v_auth_field_username, v_auth_field_password, v_auth_field_tenant, i_username, v_password, i_tenant) INTO v_user_id;
    END IF;

    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_temp_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));
        
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', v_user_id, 'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_temp_max_age_in_seconds);
END;
$$ LANGUAGE plpgsql;

-- get_user_auth_data gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.set_password(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT, i_set_provider TEXT, i_pw_hash TEXT, i_pw_meta jsonb) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_is_user_token_temp_valid BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_auth_pw_secret TEXT;
    v_auth_providers_str TEXT;
    v_auth_providers TEXT[];
    v_query TEXT;
    v_pw_bf_iter_count Int;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_pw_hash TEXT;
    v_provider jsonb;
    v_password jsonb;
BEGIN
	v_is_admin := _meta.is_admin();
	IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, true);
    v_is_user_token_temp_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, true, true);
    IF v_is_user_token_valid = FALSE AND v_is_user_token_temp_valid = FALSE THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
  
    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_pw_secret FROM _meta."Auth" WHERE key = 'auth_pw_secret';
    SELECT value INTO v_auth_providers_str FROM _meta."Auth" WHERE key = 'auth_providers';
    SELECT value INTO v_pw_bf_iter_count FROM _meta."Auth" WHERE key = 'pw_bf_iter_count';

    v_auth_providers := regexp_split_to_array(v_auth_providers_str, ':');
    
    IF array_length(v_auth_providers, 1) < 1 THEN
    	RAISE EXCEPTION 'Auth provider does not exist!';
    END IF;

    IF array_position(v_auth_providers, i_set_provider) IS NULL THEN
        RAISE EXCEPTION 'Auth provider does not exist!';
    END IF;

    v_query := $tok$SELECT id, %I FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password;

    IF v_user_id IS NULL OR v_password IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_pw_hash := crypt(encode(digest(i_pw_hash || v_auth_pw_secret, 'sha256'), 'hex'), gen_salt('bf', v_pw_bf_iter_count));

    v_provider := jsonb_build_object('hash', v_pw_hash, 'meta', i_pw_meta);

    v_password := jsonb_set(v_password, ARRAY['providers', i_set_provider], v_provider);
    
    IF v_is_user_token_temp_valid = true THEN
        v_password := jsonb_set(v_password, ARRAY['totalLogoutTimestamp'], to_jsonb(v_timestamp));
    END IF;
    
    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);
END;
$$ LANGUAGE plpgsql;

-- get_user_auth_data gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.forgot_password(i_username TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_username TEXT;
    v_auth_field_password TEXT;
    v_auth_field_tenant TEXT;
    v_query TEXT;
    v_pw_hash TEXT;
    v_user_token_temp_secret TEXT;
    v_user_token_temp_max_age_in_seconds BIGINT;
    v_bf_iter_count Int;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_user_token TEXT;
BEGIN
	v_is_admin := _meta.is_admin();
	IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;
  
    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_tenant FROM _meta."Auth" WHERE key = 'auth_field_tenant';
    SELECT value INTO v_user_token_temp_secret FROM _meta."Auth" WHERE key = 'user_token_temp_secret';
    SELECT value INTO v_user_token_temp_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_temp_max_age_in_seconds';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    IF v_auth_field_tenant IS NULL THEN
        v_query := $tok$SELECT %I->'providers'->'password'->>'hash', id FROM %I.%I WHERE %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username) INTO v_pw_hash, v_user_id;
    ELSE
        v_query := $tok$SELECT %I->'providers'->'password'->>'hash', id FROM %I.%I WHERE %I = %L AND %I = %L$tok$;
        EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username, v_auth_field_tenant, i_tenant) INTO v_pw_hash, v_user_id;
    END IF;

    IF v_user_id IS NULL OR v_pw_hash IS NULL THEN
        RAISE EXCEPTION 'User or provider not found!';
    END IF;

    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_temp_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_user_token := crypt(encode(digest(v_payload, 'sha256'), 'hex'), gen_salt('bf', v_bf_iter_count));
        
    RETURN jsonb_build_object('userToken', v_user_token, 'userId', v_user_id, 'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_temp_max_age_in_seconds, 'hash', v_pw_hash, 'sec', v_user_token_temp_secret);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


CREATE OR REPLACE FUNCTION _meta.remove_provider(i_user_id TEXT, i_user_token TEXT, i_provider TEXT, i_timestamp BIGINT, i_remove_provider TEXT) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_user_token_valid BOOLEAN;
    v_is_user_token_temp_valid BOOLEAN;
    v_auth_table TEXT;
    v_auth_table_schema TEXT;
    v_auth_field_password TEXT;
    v_query TEXT;
    v_user_id TEXT;
    v_password jsonb;
BEGIN
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'You are not permitted to execute this operation.';
    END IF;

    v_is_user_token_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, false, true);
    v_is_user_token_temp_valid := _meta.is_user_token_valid(i_user_id, i_user_token, i_provider, i_timestamp, true, true);
    IF v_is_user_token_valid = FALSE AND v_is_user_token_temp_valid = FALSE THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    IF i_provider = i_remove_provider THEN
        RAISE EXCEPTION 'You cannot remove the provider of your current session.';
    END IF;
  
    -- TODO: We may could improve this to one query
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';

    v_query := $tok$SELECT id, %I FROM %I.%I WHERE id = %L$tok$;
    EXECUTE format(v_query, v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_user_id, v_password;

    IF v_user_id IS NULL OR v_password IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    RAISE NOTICE '%', v_password;

    v_password := jsonb_set(v_password, ARRAY['providers', i_remove_provider], to_jsonb('null'::jsonb));
    
    RAISE NOTICE '%', v_password;

    v_password := jsonb_strip_nulls(v_password);
    RAISE NOTICE '%', v_password;
    
    EXECUTE format('UPDATE %I.%I SET %I = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_password, i_user_id);
END;
$$ LANGUAGE plpgsql;
