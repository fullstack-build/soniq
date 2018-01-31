CREATE OR REPLACE FUNCTION _meta.plv8_require()
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
            "SELECT source FROM _meta.plv8_js_modules WHERE module = $1",
            [module]
        );

        if(rows.length === 0) {
            plv8.elog(NOTICE, 'Could not load module: ' + module);
            return null;
        }

        return load(module, rows[0].source);
    };

    // Grab modules worth auto-loading at context start and let them cache
    const query = 'SELECT module, source FROM _meta.plv8_js_modules WHERE autoload = true';
    plv8.execute(query).forEach( function(row) {
        load(row.module, row.source);
    });
$$ LANGUAGE plv8 IMMUTABLE STRICT;