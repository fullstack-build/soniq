"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inOperator = {
    name: 'in',
    value: '[String!]',
    getSql: (context) => {
        const { field, values } = context;
        return `${field} IN (${values.join(', ')})`;
    }
};
exports.inOperator = inOperator;
const notInOperator = {
    name: 'notIn',
    value: '[String!]',
    getSql: (context) => {
        const { field, values } = context;
        return `${field} NOT IN (${values.join(', ')})`;
    }
};
exports.notInOperator = notInOperator;
const includes = {
    name: 'includes',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${value} IN ${field}`;
    }
};
exports.includes = includes;
const includesNot = {
    name: 'includesNot',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${value} IN ${field}`;
    }
};
exports.includesNot = includesNot;
const contains = {
    name: 'contains',
    value: '[String!]',
    getSql: (context) => {
        const { field, values } = context;
        return `${field} @> ARRAY[${values.join(', ')}]`;
    }
};
exports.contains = contains;
const isContainedBy = {
    name: 'isContainedBy',
    value: '[String!]',
    getSql: (context) => {
        const { field, values } = context;
        return `${field} <@ ARRAY[${values.join(', ')}]`;
    }
};
exports.isContainedBy = isContainedBy;
