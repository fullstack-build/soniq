"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const like = {
    name: 'like',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text LIKE ${value}`;
    }
};
exports.like = like;
const notLike = {
    name: 'notLike',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text NOT LIKE ${value}`;
    }
};
exports.notLike = notLike;
const iLike = {
    name: 'iLike',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text ILIKE ${value}`;
    }
};
const notILike = {
    name: 'notILike',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text NOT ILIKE ${value}`;
    }
};
const similarTo = {
    name: 'similarTo',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text SIMILAR TO ${value}`;
    }
};
exports.similarTo = similarTo;
const notSimilarTo = {
    name: 'notSimilarTo',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text NOT SIMILAR TO ${value}`;
    }
};
exports.notSimilarTo = notSimilarTo;
const posixMatchCaseSensitive = {
    name: 'posixMatchCaseSensitive',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text ~ ${value}`;
    }
};
exports.posixMatchCaseSensitive = posixMatchCaseSensitive;
const posixMatchCaseInsensitive = {
    name: 'posixMatchCaseInsensitive',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text ~* ${value}`;
    }
};
exports.posixMatchCaseInsensitive = posixMatchCaseInsensitive;
const posixNoMatchCaseSensitive = {
    name: 'posixNoMatchCaseSensitive',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text !~ ${value}`;
    }
};
exports.posixNoMatchCaseSensitive = posixNoMatchCaseSensitive;
const posixNoMatchCaseInsensitive = {
    name: 'posixNoMatchCaseInsensitive',
    value: 'String',
    getSql: (context) => {
        const { field, value } = context;
        return `${field}::text !~* ${value}`;
    }
};
exports.posixNoMatchCaseInsensitive = posixNoMatchCaseInsensitive;
