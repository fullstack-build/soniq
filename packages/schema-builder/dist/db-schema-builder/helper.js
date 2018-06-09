"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const _ = require("lodash");
/**
 * Helper
 */
function splitActionFromNode(actionKey, node = {}) {
    // clone first level of object (to avoid manipulating the actual action on the object)
    const nodeClone = Object.assign({}, node);
    const action = nodeClone[actionKey] || {};
    // remove action from obj
    delete nodeClone[actionKey];
    return {
        action,
        node: nodeClone
    };
}
exports.splitActionFromNode = splitActionFromNode;
/**
 * Deep diff between two object, using lodash
 * @param  {Object} obj Object compared
 * @param  {Object} base  Object to compare with
 * @param  {boolean} ignoreValue  Ignore different string, number and boolean values
 * @return {Object}        Return a new object who represent the diff
 */
function difference(obj, base, ignoreValue = false) {
    function changes(pObj, pBase) {
        return _.transform(pObj, (result, value, key) => {
            let thisValue = value;
            // ignore different string, number and boolean values
            if (!!ignoreValue) {
                // ignoring done by replacing old value with new value
                if (typeof thisValue === 'string' || typeof thisValue === 'number' || typeof thisValue === 'boolean') {
                    thisValue = pBase[key];
                }
            }
            // deep equal
            if (!_.isEqual(thisValue, pBase[key])) {
                result[key] = (util_1.isObject(thisValue) && util_1.isObject(pBase[key])) ? changes(thisValue, pBase[key]) : thisValue;
            }
        });
    }
    return changes(obj, base);
}
exports.difference = difference;
/**
 * Deep add key and value to last node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
function addToLastNode(obj, addKey, addValue) {
    function nested(pObj) {
        return _.transform(pObj, (result, value, key) => {
            // check if object has children
            const hasChildren = (Object.values(pObj).find((thisVal) => {
                return util_1.isObject(thisVal);
            }) != null);
            // add to last node
            if (!hasChildren) {
                result[addKey] = addValue;
            }
            // recursion
            result[key] = (util_1.isObject(value)) ? nested(value) : value;
        });
    }
    return nested(obj);
}
exports.addToLastNode = addToLastNode;
/**
 * Deep add key and value to every node
 * @param  {Object} obj Object compared
 * @param  {string} addKey  key that should be added
 * @param  {any} addValue  value that should be added
 * @return {Object}        Return a new object who represent the diff
 */
function addToEveryNode(obj, addKey, addValue) {
    function nested(pObj) {
        return _.transform(pObj, (result, value, key) => {
            // add to very "object" node
            result[addKey] = addValue;
            // recursion
            result[key] = (util_1.isObject(value)) ? nested(value) : value;
        });
    }
    return nested(obj);
}
exports.addToEveryNode = addToEveryNode;
/**
 * Deep removal key from every node
 * @param  {Object} obj Object compared
 * @param  {string} removeKey  key that should be added
 * @return {Object}        Return a new object who represent the diff
 */
function removeFromEveryNode(obj, removeKey) {
    function nested(pObj) {
        return _.transform(pObj, (result, value, key) => {
            // remove from every node
            if (value != null) {
                delete value[removeKey];
            }
            // recursion
            result[key] = (util_1.isObject(value)) ? nested(value) : value;
        });
    }
    return nested(obj);
}
exports.removeFromEveryNode = removeFromEveryNode;
/**
 * Deep removal of empty objects
 * @param  {Object} obj Object to be cleaned
 * @return {Object}        Return a new cleaned up object
 */
function cleanObject(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (value === undefined) {
                delete obj[key];
            }
            if (typeof value === 'object' && !(value instanceof Date)) {
                cleanObject(obj[key]);
                if (value === null) {
                    continue;
                }
                if (!Array.isArray(value) && !Object.keys(value).length) {
                    delete obj[key];
                }
            }
        }
    }
    return obj;
}
exports.cleanObject = cleanObject;
// returns simple object without nested objects
function getPropertiesWithoutNested(obj, propertiesToIgnore = []) {
    if (obj != null) {
        if (Array.isArray(obj)) {
            return [...obj];
        }
        else {
            return Object.entries(obj).reduce((result, entry) => {
                const key = entry[0];
                const val = entry[1];
                if (!util_1.isObject(val) && propertiesToIgnore.indexOf(key) === -1) {
                    result[key] = val;
                }
                return result;
            }, {});
        }
    }
    return obj;
}
exports.getPropertiesWithoutNested = getPropertiesWithoutNested;
