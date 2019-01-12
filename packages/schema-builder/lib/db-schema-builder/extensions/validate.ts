import {
  IDbMeta,
  registerDirectiveParser,
  registerTriggerParser,
  registerColumnMigrationExtension,
  registerTableMigrationExtension,
  splitActionFromNode,
  createConstraint,
  utils
} from "../../index";

// GQl AST
// add directive parser
registerDirectiveParser("validate", (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => {
  // iterate over all constraints
  gQlDirectiveNode.arguments.forEach((argument) => {
    const constraintType = "CHECK"; // validate turns into a simple check
    const validateType = argument.name.value;
    const constraintName = `${refDbMetaCurrentTable.name}_${refDbMetaCurrentTableColumn.name}_${validateType}_check`;
    const options = {
      param1: `_meta.validate('${validateType}'::text, ("${refDbMetaCurrentTableColumn.name}")::text, '${argument.value.value}'::text)`
    };
    // create constraint
    createConstraint(constraintName, constraintType, options, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn);
  });
});

// PG & Migration SQL
// nothing to do here -> simple check
