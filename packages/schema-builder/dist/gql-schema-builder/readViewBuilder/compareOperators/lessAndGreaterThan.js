"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const greaterThan = {
    name: "greaterThan",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} > ${value}`;
    }
};
exports.greaterThan = greaterThan;
const greaterThanOrEqual = {
    name: "greaterThanOrEqual",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} >= ${value}`;
    }
};
exports.greaterThanOrEqual = greaterThanOrEqual;
const lessThan = {
    name: "lessThan",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} < ${value}`;
    }
};
exports.lessThan = lessThan;
const lessThanOrEqual = {
    name: "lessThanOrEqual",
    value: "String",
    getSql: (context) => {
        const { field, value } = context;
        return `${field} <= ${value}`;
    }
};
exports.lessThanOrEqual = lessThanOrEqual;
