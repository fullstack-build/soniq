"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
// GQl AST
// add directive parser
index_1.registerDirectiveParser("validate", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
    // iterate over all constraints
    gQlDirectiveNode.arguments.forEach((argument) => {
        const constraintType = "CHECK"; // validate turns into a simple check
        const validateType = argument.name.value;
        const constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_${validateType}_check`;
        const options = {
            param1: `_meta.validate('${validateType}'::text, ("${refDbMetaCurrentTableColumn.name}")::text, '${argument.value.value}'::text)`
        };
        // create constraint
        index_1.createConstraint(constraintName, constraintType, options, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
    });
});
// PG & Migration SQL
// nothing to do here -> simple check
