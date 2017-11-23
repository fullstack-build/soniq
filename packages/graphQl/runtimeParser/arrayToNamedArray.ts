export default (pArray: any): any => {
  return pArray.reduce((obj, elem) => {
    obj[elem.name] = elem;
    return obj;
  // tslint:disable-next-line:align
  }, {});
};
