CREATE OR REPLACE FUNCTION _meta.plv8_require()
returns void as $$

    plv8.moduleCache = plv8.moduleCache || {};

    plv8.load = plv8.load || function (key, source) {
        const module = {exports: {}};
        eval("(function(module, exports) {" + source + "; })")(module, module.exports);

        // store in cache
        plv8.moduleCache[key] = module.exports;
        return module.exports;
    };

    plv8.require = plv8.require || function (module) {
        if(plv8.moduleCache[module]) {
            return plv8.moduleCache[module];
        }

        var rows = plv8.execute(
            "SELECT source FROM _meta.plv8_js_modules WHERE module = $1",
            [module]
        );

        if(rows.length === 0) {
            plv8.elog(NOTICE, 'Could not load module: ' + module);
            return null;
        }

        return plv8.load(module, rows[0].source);
    };
    require = plv8.require;

    // Grab modules worth auto-loading at context start and let them cache
    // as long as the cache is active
    if (plv8.moduleCache == null || plv8.moduleCache.length === 0) {
      const query = 'SELECT module, source FROM _meta.plv8_js_modules WHERE autoload = true';
      plv8.execute(query).forEach( function(row) {
         plv8.load(row.module, row.source);
      });
    }
$$ LANGUAGE plv8 IMMUTABLE STRICT;