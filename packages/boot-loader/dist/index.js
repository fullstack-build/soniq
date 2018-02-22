"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("@fullstack-one/di");
let BootLoader = class BootLoader {
    constructor() {
        this.bootFunctions = [];
        this.bootReadyFunctions = [];
        this.hasBooted = false;
    }
    addBootFunction(fn) {
        this.bootFunctions.push(fn);
    }
    onBootReady(fn) {
        if (this.hasBooted) {
            return fn();
        }
        this.bootReadyFunctions.push(fn);
    }
    getReadyPromise() {
        return new Promise((resolve, reject) => {
            if (this.hasBooted) {
                return resolve();
            }
            this.bootReadyFunctions.push(resolve);
        });
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const fn of this.bootFunctions) {
                yield fn(this);
            }
            for (const fn of this.bootReadyFunctions) {
                fn(this);
            }
        });
    }
};
BootLoader = __decorate([
    di_1.Service()
], BootLoader);
exports.BootLoader = BootLoader;
