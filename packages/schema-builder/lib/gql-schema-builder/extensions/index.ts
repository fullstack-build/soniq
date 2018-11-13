import * as jsonParser from "./json";
import * as computedParser from "./computed";
import * as customParser from "./custom";
import * as relationParser from "./relation";
import * as defaultParser from "./default";
import * as id from "./id";

export const extensions = [id, jsonParser, computedParser, customParser, relationParser, defaultParser];
