"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const equal = {
    name: "equals",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} = ${value}`;
    }
};
exports.equal = equal;
const notEqual = {
    name: "equalsNot",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} <> ${value}`;
    }
};
exports.notEqual = notEqual;
const isDistinctFrom = {
    name: "isDistinctFrom",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} IS DISTINCT FROM ${value}`;
    }
};
exports.isDistinctFrom = isDistinctFrom;
const isNotDistinctFrom = {
    name: "isNotDistinctFrom",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} IS NOT DISTINCT FROM ${value}`;
    }
};
exports.isNotDistinctFrom = isNotDistinctFrom;
