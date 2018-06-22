"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const equal = require("./equal");
const lessAndGreaterThan = require("./lessAndGreaterThan");
const boolean = require("./boolean");
const inOperators = require("./in");
const pattern = require("./pattern");
const operators = Object.assign({}, equal, lessAndGreaterThan, boolean, inOperators, pattern);
exports.operators = operators;
const operatorsObject = {};
exports.operatorsObject = operatorsObject;
const operatorKeys = Object.values(operators).map((operator) => {
    if (operatorsObject[operator.name] != null) {
        throw new Error(`Operator '${operator.name}' has been defined twice!`);
    }
    operatorsObject[operator.name] = operator;
    return operator.name;
});
exports.operatorKeys = operatorKeys;
