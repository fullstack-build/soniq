CREATE TABLE IF NOT EXISTS  _meta.plv8_js_modules (
    module text unique primary key,
    autoload bool default true,
    source text
);