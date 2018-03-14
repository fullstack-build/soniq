"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pArray) => {
    return pArray.reduce((obj, elem) => {
        obj[elem.name] = elem;
        return obj;
        // tslint:disable-next-line:align
    }, {});
};
