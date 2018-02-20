"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ONE = require("./index");
/*
* helpers
* */
class AbstractPackage {
    // return CONFIG
    // return either full config or only module config
    getConfig(pModuleName) {
        const config = ONE.Container.get('CONFIG');
        if (pModuleName == null) {
            // return copy instead of a ref
            return Object.assign({}, config);
        }
        else {
            // return copy instead of a ref
            return Object.assign({}, config[pModuleName]);
        }
    }
}
exports.AbstractPackage = AbstractPackage;
