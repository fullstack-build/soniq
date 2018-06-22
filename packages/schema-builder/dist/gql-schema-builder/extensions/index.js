"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonParser = require("./json");
const computedParser = require("./computed");
const customParser = require("./custom");
const relationParser = require("./relation");
const defaultParser = require("./default");
const id = require("./id");
exports.extensions = [
    id,
    jsonParser,
    computedParser,
    customParser,
    relationParser,
    defaultParser
];
