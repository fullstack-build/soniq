declare const like: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const notLike: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const similarTo: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const notSimilarTo: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const posixMatchCaseSensitive: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const posixMatchCaseInsensitive: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const posixNoMatchCaseSensitive: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const posixNoMatchCaseInsensitive: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
export {
  like,
  notLike,
  similarTo,
  notSimilarTo,
  posixMatchCaseSensitive,
  posixMatchCaseInsensitive,
  posixNoMatchCaseSensitive,
  posixNoMatchCaseInsensitive
};
