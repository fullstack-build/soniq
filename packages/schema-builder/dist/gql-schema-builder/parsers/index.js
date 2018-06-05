"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonParser = require("./json");
const idParser = require("./id");
const computedParser = require("./computed");
const customParser = require("./custom");
const relationParser = require("./relation");
const defaultParser = require("./default");
const viewnamesParser = require("./viewnames");
const expressionsParser = require("./expressions");
const mutationsParser = require("./mutations");
const forbidRootLevelGenericAggregation = require("./forbidRootLevelGenericAggregation");
const authRequiredForUpdateAndDelete = require("./authRequiredForUpdateAndDelete");
exports.parsers = [
    jsonParser,
    idParser,
    computedParser,
    customParser,
    relationParser,
    defaultParser,
    viewnamesParser,
    expressionsParser,
    mutationsParser,
    forbidRootLevelGenericAggregation,
    authRequiredForUpdateAndDelete
];
