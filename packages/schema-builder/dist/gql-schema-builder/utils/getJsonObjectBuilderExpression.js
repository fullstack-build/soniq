"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildJsonObject(obj, fieldExpression, prePath) {
    const values = [];
    Object.keys(obj).forEach((key) => {
        const field = obj[key];
        values.push(`'${key}'`);
        if (field === true) {
            const p = prePath
                .map((prePathName) => {
                return ` -> '${prePathName}'`;
            })
                .join("");
            values.push(`${fieldExpression}${p} -> '${key}'`);
        }
        else {
            const nextPrePath = prePath.slice();
            nextPrePath.push(key);
            values.push(buildJsonObject(field, fieldExpression, nextPrePath));
        }
    });
    return `jsonb_build_object(${values.join(", ")})`;
}
function getJsonObjectBuilderExpression(matchObject, fieldName, tableName) {
    const fieldExpression = `COALESCE("${tableName}"."${fieldName}", jsonb_build_object())`;
    return `${buildJsonObject(matchObject[fieldName], fieldExpression, [])}`;
}
exports.getJsonObjectBuilderExpression = getJsonObjectBuilderExpression;
