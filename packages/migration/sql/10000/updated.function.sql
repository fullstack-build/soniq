CREATE OR REPLACE FUNCTION _meta.triggerUpdateOrCreate() RETURNS trigger AS $$
	NEW[TG_ARGV[0]] = new Date();
	return NEW;
$$ LANGUAGE plv8 STABLE;