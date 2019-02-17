import { IParser } from "./interfaces";
import computedParser from "./computedParser";
import customParser from "./customParser";
import defaultParser from "./defaultParser";
import idParser from "./idParser";
import jsonParser from "./jsonParser";
import relationParser from "./relationParser";

export const extensions: IParser[] = [computedParser, customParser, defaultParser, idParser, jsonParser, relationParser];
