
CREATE TABLE "_meta"."Auth" (
    "key" varchar,
    "value" varchar,
    PRIMARY KEY ("key")
);

INSERT INTO "_meta"."Auth"("key","value")
VALUES
(E'admin_token_secret',E'boss'),
(E'auth_field_password',E'username'),
(E'auth_field_tenant',NULL),
(E'auth_field_username',E'email'),
(E'auth_table',E'User'),
(E'auth_table_schema',E'public'),
(E'bf_iter_count',E'6'),
(E'transaction_token_max_age_in_seconds',E'86400'),
(E'transaction_token_secret',E'$2a$04$.924KyFJ4Otw7Vn5/e8JAOsJ5zaTQnLEM.mIOfMp6VTWfLuwsep4y'),
(E'transaction_token_timestamp',E'1515365172'),
(E'user_token_max_age_in_seconds',E'1209600'),
(E'user_token_secret',E'geheim');


-- set local auth.admin_token to '1515332430747:f62c0c0a744ed5103d370fae033085bf0c8dbd4ff6bf7247e359c21eff2e2235';

-- SELECT is_admin();

-- SELECT extract(epoch from now())*1000::bigint;

-- is_admin function checks if a user is allowed to execute other security functions like set_user and login
CREATE OR REPLACE FUNCTION _meta.is_admin() RETURNS boolean AS $$
DECLARE
    v_admin_token_secret   TEXT;
    v_admin_token TEXT;
    v_parts TEXT[];
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
    
    v_timestamp := v_parts[1];
    v_signature := v_parts[2];

    IF v_timestamp IS NULL OR v_signature IS NULL THEN
        RETURN false;
    END IF;
    
    v_payload := v_timestamp || ':' || v_admin_token_secret;
  
    IF v_signature = encode(digest(v_payload, 'sha256'), 'hex') THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- get_user_auth_data gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.get_user_auth_data(i_username TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin   BOOLEAN;
    v_user_token_secret   TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_username   TEXT;
    v_auth_field_password   TEXT;
    v_auth_field_tenant   TEXT;
    v_bf_iter_count INT;
    v_pw TEXT;
    v_pw_parts TEXT[];
    v_pw_hash TEXT;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_signature TEXT;
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
    SELECT value INTO v_auth_field_username FROM _meta."Auth" WHERE key = 'auth_field_username';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_auth_field_tenant FROM _meta."Auth" WHERE key = 'auth_field_tenant';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';
    
    IF v_auth_field_tenant IS NULL THEN
        EXECUTE format('SELECT "%s", id FROM "%s"."%s" WHERE "%s" = %L', v_auth_field_password, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username) INTO v_pw, v_user_id;
    ELSE
    	EXECUTE format('SELECT "%s", id FROM "%s"."%s" WHERE "%s" = %L AND "%s" = %L', v_auth_field_password, v_auth_table_schema, v_auth_table, v_auth_field_username, i_username, v_auth_field_tenant, i_tenant) INTO v_pw, v_user_id;
    END IF;

    v_pw_parts := regexp_split_to_array(v_pw, ':');

    IF array_length(v_pw_parts, 1) < 2 THEN
    	RAISE EXCEPTION 'User is not valid!';
    END IF;

    v_pw_hash := v_pw_parts[0];
    
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;
    
    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_signature := encode(digest(v_payload, 'sha256'), 'hex');
    
    v_user_token := crypt(v_signature, gen_salt('bf', v_bf_iter_count));
        
    RETURN jsonb_build_object('passwordHash', v_pw_hash, 'userToken', v_user_token, 'userId', v_user_id, 'timestamp', v_timestamp, 'userTokenMaxAgeInSeconds', v_user_token_max_age_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- set_user_token sets the current user for one transaction
CREATE OR REPLACE FUNCTION _meta.set_user_token(i_user_id TEXT, i_user_token TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_user_token_secret   TEXT;
    v_transaction_token_secret   TEXT;
    v_transaction_token_timestamp INT;
    v_user_token_max_age_in_seconds BIGINT;
    v_transaction_token_max_age_in_seconds INT;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_password   TEXT;
    v_bf_iter_count INT;
    v_pw TEXT;
    v_pw_parts TEXT[];
    v_pw_hash TEXT;
    v_pw_logout BIGINT;
    v_pw_ts_position INT;
    v_timestamp BIGINT;
    v_timestamp_sec INT;
    v_payload TEXT;
    v_signature TEXT;
    v_user_token TEXT;
    v_transaction_payload TEXT;
    v_transaction_signature TEXT;
    v_transaction_token TEXT;
BEGIN
    -- TODO: We may could improve this to one query
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    SELECT value INTO v_transaction_token_secret FROM _meta."Auth" WHERE key = 'transaction_token_secret';
    SELECT value INTO v_transaction_token_timestamp FROM _meta."Auth" WHERE key = 'transaction_token_timestamp';
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_transaction_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'transaction_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;
    v_timestamp_sec := round(extract(epoch from now()))::int;

    IF v_timestamp - i_timestamp > (v_user_token_max_age_in_seconds * 1000) THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    IF (v_timestamp_sec - v_transaction_token_timestamp) > v_transaction_token_max_age_in_seconds THEN
        UPDATE "_meta"."Auth" SET "value"=crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4)) WHERE "key"='transaction_token_secret';
        UPDATE "_meta"."Auth" SET "value"=round(extract(epoch from now()))::text WHERE "key"='transaction_token_timestamp';
    END IF;
    
    EXECUTE format('SELECT "%s" FROM "%s"."%s" WHERE id = %L', v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw;
    
    IF v_pw IS NULL THEN
      RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_pw_parts := regexp_split_to_array(v_pw, ':');

    IF array_length(v_pw_parts, 1) < 2 THEN
    	RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_pw_hash := v_pw_parts[0];

    v_pw_logout := v_pw_parts[1]::BIGINT;

    IF v_pw_logout >= i_timestamp THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_pw_ts_position := array_position(v_pw_parts, i_timestamp::text)

    IF v_pw_ts_position IS NOT NULL AND v_pw_ts_position > 2 THEN
    	RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    
    v_payload := v_pw_hash || ':' || i_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_signature := encode(digest(v_payload, 'sha256'), 'hex');
    
    v_user_token := crypt(v_signature, i_user_token);

    IF i_user_token != v_user_token THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_transaction_payload := i_user_id || ':' || i_timestamp || ':' || txid_current() || v_transaction_token_secret;

    v_transaction_signature := encode(digest(v_transaction_payload, 'sha256'), 'hex');

    v_transaction_token := i_user_id || ':' || i_timestamp || ':' || v_transaction_signature;
    
    EXECUTE format('set local auth.transaction_token to %L', v_transaction_token);
END;
$$ LANGUAGE plpgsql;

-- current_user_id function returns the id of the current user if the transaction_token is present and valid
CREATE OR REPLACE FUNCTION _meta.current_user_id() RETURNS uuid AS $$
DECLARE
    v_transaction_token_secret   TEXT;
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
CREATE OR REPLACE FUNCTION _meta.invalidate_user_token(i_user_id TEXT, i_user_token TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_user_token_secret   TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_password   TEXT;
    v_pw TEXT;
    v_pw_parts TEXT[];
    v_pw_hash TEXT;
    v_pw_logout BIGINT;
    v_pw_ts_position INT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_signature TEXT;
    v_user_token TEXT;
    v_counter INT;
    v_ts_to_clear INT[];
    v_new_pw TEXT;
BEGIN
    -- TODO: We may could improve this to one query
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    IF v_timestamp - i_timestamp > (v_user_token_max_age_in_seconds * 1000) THEN
        RETURN;
    END IF;
    
    EXECUTE format('SELECT "%s" FROM "%s"."%s" WHERE id = %L', v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw;
    
    IF v_pw IS NULL THEN
        RETURN;
    END IF;

    v_pw_parts := regexp_split_to_array(v_pw, ':');

    IF array_length(v_pw_parts, 1) < 2 THEN
    	RETURN;
    END IF;

    v_pw_hash := v_pw_parts[0];

    v_pw_logout := v_pw_parts[1]::BIGINT;

    IF v_pw_logout >= i_timestamp THEN
        RETURN;
    END IF;

    v_pw_ts_position := array_position(v_pw_parts, i_timestamp::text)

    IF v_pw_ts_position IS NOT NULL AND v_pw_ts_position > 2 THEN
    	RETURN;
    END IF;
    
    v_payload := v_pw_hash || ':' || i_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_signature := encode(digest(v_payload, 'sha256'), 'hex');
    
    v_user_token := crypt(v_signature, i_user_token);

    IF i_user_token != v_user_token THEN
        RETURN;
    END IF;

    v_ts_to_clear := ARRAY[];

    LOOP 
        EXIT WHEN v_counter = array_length(v_pw_parts) + 1; 
        v_counter := v_counter + 1;
        IF v_timestamp - v_pw_parts[v_counter] > (v_user_token_max_age_in_seconds * 1000) THEN
            v_ts_to_clear := array_append(v_ts_to_clear, v_pw_parts[v_counter]);
        END IF;
    END LOOP;

    FOREACH i IN ARRAY v_ts_to_clear
    LOOP 
        v_pw_parts := array_remove(v_pw_parts, i);
    END LOOP;

    v_pw_parts := array_append(v_pw_parts, i_timestamp::text);

    v_new_pw := array_to_string(v_pw_parts, ',', '0');

    EXECUTE format('UPDATE "%s"."%s" SET "%s" = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_new_pw, i_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- invalidate_user_token invalidates the current token, nothing else
CREATE OR REPLACE FUNCTION _meta.invalidate_all_user_tokens(i_user_id TEXT, i_user_token TEXT, i_timestamp BIGINT) RETURNS void AS $$
DECLARE
    v_user_token_secret   TEXT;
    v_user_token_max_age_in_seconds BIGINT;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_password   TEXT;
    v_pw TEXT;
    v_pw_parts TEXT[];
    v_pw_hash TEXT;
    v_pw_logout BIGINT;
    v_pw_ts_position INT;
    v_timestamp BIGINT;
    v_payload TEXT;
    v_signature TEXT;
    v_user_token TEXT;
    v_new_pw TEXT;
BEGIN
    -- TODO: We may could improve this to one query
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    SELECT value INTO v_user_token_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_max_age_in_seconds';
    SELECT value INTO v_auth_table FROM _meta."Auth" WHERE key = 'auth_table';
    SELECT value INTO v_auth_table_schema FROM _meta."Auth" WHERE key = 'auth_table_schema';
    SELECT value INTO v_auth_field_password FROM _meta."Auth" WHERE key = 'auth_field_password';
    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    IF v_timestamp - i_timestamp > (v_user_token_max_age_in_seconds * 1000) THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    
    EXECUTE format('SELECT "%s" FROM "%s"."%s" WHERE id = %L', v_auth_field_password, v_auth_table_schema, v_auth_table, i_user_id) INTO v_pw;
    
    IF v_pw IS NULL THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_pw_parts := regexp_split_to_array(v_pw, ':');

    IF array_length(v_pw_parts, 1) < 2 THEN
    	RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_pw_hash := v_pw_parts[0];

    v_pw_logout := v_pw_parts[1]::BIGINT;

    IF v_pw_logout >= i_timestamp THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_pw_ts_position := array_position(v_pw_parts, i_timestamp::text)

    IF v_pw_ts_position IS NOT NULL AND v_pw_ts_position > 2 THEN
    	RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;
    
    v_payload := v_pw_hash || ':' || i_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_signature := encode(digest(v_payload, 'sha256'), 'hex');
    
    v_user_token := crypt(v_signature, i_user_token);

    IF i_user_token != v_user_token THEN
        RAISE EXCEPTION 'Session expired or token invalid.';
    END IF;

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_new_pw := v_pw_hash || ':' || v_timestamp;

    EXECUTE format('UPDATE "%s"."%s" SET "%s" = %L WHERE id = %L', v_auth_table_schema, v_auth_table, v_auth_field_password, v_new_pw, i_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- get_user_auth_data gets all data required by node login procedure
CREATE OR REPLACE FUNCTION _meta.register_user(i_username TEXT, i_tenant TEXT) RETURNS jsonb AS $$
DECLARE
    v_is_admin   BOOLEAN;
    v_auth_table   TEXT;
    v_auth_table_schema   TEXT;
    v_auth_field_username   TEXT;
    v_auth_field_password   TEXT;
    v_auth_field_tenant   TEXT;
    v_user_token_secret TEXT;
    v_user_token_temp_max_age_in_seconds TEXT;
    v_bf_iter_count TEXT;
    v_user_id TEXT;
    v_timestamp BIGINT;
    v_pw_hash TEXT;
    v_payload TEXT;
    v_signature TEXT;
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
    SELECT value INTO v_user_token_secret FROM _meta."Auth" WHERE key = 'user_token_secret';
    SELECT value INTO v_user_token_temp_max_age_in_seconds FROM _meta."Auth" WHERE key = 'user_token_temp_max_age_in_seconds';
    SELECT value INTO v_bf_iter_count FROM _meta."Auth" WHERE key = 'bf_iter_count';

    v_timestamp := (round(extract(epoch from now())*1000))::bigint;

    v_pw_hash = 'NEW' || crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4));

    v_new_pw := v_pw_hash || ':' || v_timestamp;
    
    IF v_auth_field_tenant IS NULL THEN
        EXECUTE format('INSERT INTO "%s"."%s"("%s", "%s") VALUES(%L, %L) RETURNING id',v_auth_table_schema, v_auth_table, v_auth_field_username, v_auth_field_password, i_username, v_new_pw) INTO v_user_id;
    ELSE
        EXECUTE format('INSERT INTO "%s"."%s"("%s", "%s", "%s") VALUES(%L, %L, %L) RETURNING id',v_auth_table_schema, v_auth_table, v_auth_field_username, v_auth_field_password, v_auth_field_tenant, i_username, v_new_pw, i_tenant) INTO v_user_id;
    END IF;

    v_payload := v_pw_hash || ':' || v_timestamp || ':' || v_user_token_secret;
    
    -- We need to hash the payload with sha256 before bf crypt because bf only accepts up to 72 chars
    v_signature := encode(digest(v_payload, 'sha256'), 'hex');
    
    v_user_token := crypt(v_signature, gen_salt('bf', v_bf_iter_count));
        
    RETURN jsonb_build_object('userTokenTemp', v_user_token, 'userId', v_user_id, 'timestamp', v_timestamp, 'userTokenTempMaxAgeInSeconds', v_user_token_temp_max_age_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;