-- PL/V8 modules
-- https://rymc.io/2016/03/22/a-deep-dive-into-plv8/
-- https://github.com/JerrySievert/plv8-modules
CREATE TABLE _management.plv8_js_modules (
    module text unique primary key,
    autoload bool default true,
    source text
);

CREATE OR REPLACE FUNCTION _management.plv8_require()
returns void as $$
    moduleCache = {};

    load = function(key, source) {
        const module = {exports: {}};
        eval("(function(module, exports) {" + source + "; })")(module, module.exports);

        // store in cache
        moduleCache[key] = module.exports;
        return module.exports;
    };

    require = function(module) {
        if(moduleCache[module]) {
            return moduleCache[module];
        }

        var rows = plv8.execute(
            "SELECT source FROM _management.plv8_js_modules WHERE module = $1",
            [module]
        );

        if(rows.length === 0) {
            plv8.elog(NOTICE, 'Could not load module: ' + module);
            return null;
        }

        return load(module, rows[0].source);
    };

    // Grab modules worth auto-loading at context start and let them cache
    const query = 'SELECT module, source FROM _management.plv8_js_modules WHERE autoload = true';
    plv8.execute(query).forEach(function(row) {
        load(row.module, row.source);
    });
$$ LANGUAGE plv8 IMMUTABLE STRICT;

-- PL/v8 supports a "start proc" variable that can act as a bootstrap function.
SET plv8.start_proc = '_management.plv8_require';
-- and start in case event was fired already
SELECT _management.plv8_require();