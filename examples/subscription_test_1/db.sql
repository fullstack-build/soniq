DROP TRIGGER "createSubscription" ON subscriptions;
CREATE TRIGGER "createSubscription"
  BEFORE INSERT
  ON subscriptions FOR EACH ROW
  EXECUTE PROCEDURE "createSubscription"();

DROP FUNCTION "createSubscription"() CASCADE;

CREATE OR REPLACE FUNCTION "createSubscription"() RETURNS TRIGGER AS $$
DECLARE
    queryHash TEXT;
    previousName TEXT;
    currentName TEXT;
    deltaName TEXT;
    cleanName TEXT;
BEGIN
	-- create query hash
	queryHash := encode(digest(NEW.query, 'sha256'), 'hex');
	NEW."queryHash" = queryHash;

    previousName := '"' || NEW.id || '_previous"';
    currentName  := '"' || NEW.id || '_current"';
    deltaName    := '"' || NEW.id || '_delta"';

	-- create prev materialized view
	EXECUTE 'CREATE MATERIALIZED VIEW ' || previousName || ' AS ' || NEW.query;

	-- create current view
	EXECUTE 'CREATE VIEW ' || currentName || ' AS ' || NEW.query;

	-- create delta view
	EXECUTE 'CREATE VIEW ' || deltaName || ' AS SELECT ' || currentName ||  '.* FROM ' || currentName || ' FULL OUTER JOIN ' || previousName || ' USING (id) WHERE ' || currentName || '.id IS NULL OR ' || previousName || '.id IS NULL';

	-- return trigger
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "endSubscription"
  BEFORE DELETE
  ON subscriptions FOR EACH ROW
  EXECUTE PROCEDURE "endSubscription"();

CREATE OR REPLACE FUNCTION "endSubscription"() RETURNS TRIGGER AS $$
DECLARE
    previousName TEXT;
    currentName TEXT;
    deltaName TEXT;
BEGIN
    previousName := '"' || OLD.id || '_previous"';
    currentName  := '"' || OLD.id || '_current"';
    deltaName    := '"' || OLD.id || '_delta"';

	-- drop all subscriptions related views
	EXECUTE 'DROP VIEW ' || deltaName || ' CASCADE';
	EXECUTE 'DROP MATERIALIZED VIEW ' || previousName || ' CASCADE';
	EXECUTE 'DROP VIEW ' || currentName || ' CASCADE';

	-- return trigger
	RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION publishTrigger() RETURNS TRIGGER AS $$
DECLARE
	subscriptionCursor CURSOR FOR SELECT * FROM subscriptions;
	subscription subscriptions%rowtype;
	deltaIds uuid[];
BEGIN


	-- iterate subscriptions
	FOR subscription in subscriptionCursor LOOP
    	-- collect all updated entries
		EXECUTE FORMAT('SELECT ARRAY_AGG(id) FROM %s', quote_ident(subscription.id || '_delta')) INTO deltaIds;

--		INSERT INTO notifications (payload) VALUES(deltaIds);

		-- NOTIFY SUBSCRIBERS
		PERFORM PG_NOTIFY(subscription.id::text, array_to_json(deltaIds)::TEXT);

	    -- update materialized view
		EXECUTE FORMAT('REFRESH MATERIALIZED VIEW "%s_previous"', subscription.id); -- don't run CONCURRENTLY, otherwise we miss out

    END LOOP;

	-- return trigger
	RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- should be added by directive @subscribable
CREATE TRIGGER publishToSubscribers AFTER INSERT OR UPDATE OR DELETE ON "Post" FOR EACH ROW EXECUTE PROCEDURE publishTrigger();



----------------------


DROP FUNCTION refreshallmaterializedviews(text);
CREATE OR REPLACE FUNCTION RefreshAllMaterializedViews(schema_arg TEXT DEFAULT 'public')
RETURNS BOOLEAN AS $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Refreshing materialized view in schema %', schema_arg;
    FOR r IN SELECT matviewname FROM pg_matviews WHERE schemaname = schema_arg
    LOOP
        RAISE NOTICE 'Refreshing %.%', schema_arg, r.matviewname;
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || schema_arg || '.' || '"' || r.matviewname || '"'; -- don't run CONCURRENTLY, otherwise we miss out changes
    END LOOP;

    RETURN TRUE;
END
$$ LANGUAGE plpgsql;

SELECT RefreshAllMaterializedViews();


CREATE FUNCTION test_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' then
        raise notice 'INSERT trigger, NEW = [%]', NEW;
    ELSIF TG_OP = 'UPDATE' then
        raise notice 'UPDATE trigger, OLD = [%], NEW = [%]', OLD, NEW;
    ELSE
        raise notice 'DELETE trigger, OLD = [%]', OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION test_trigger() CASCADE;
CREATE OR REPLACE FUNCTION test_trigger() RETURNS TRIGGER AS $$
BEGIN
	RAISE EXCEPTION 'CHANGES!';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER test_it ON "VPost";






