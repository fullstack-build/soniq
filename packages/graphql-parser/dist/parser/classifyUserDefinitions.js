"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findDirectiveIndex_1 = require("./findDirectiveIndex");
exports.default = (source) => {
    const tables = {};
    const otherDefinitions = [];
    Object.values(source.definitions).forEach((node) => {
        if (node.kind === 'ObjectTypeDefinition' && findDirectiveIndex_1.default(node, 'table') !== -1) {
            tables[node.name.value] = node;
        }
        else {
            otherDefinitions.push(node);
        }
    });
    // console.log({ tables, otherDefinitions });
    return { tables, otherDefinitions };
};
