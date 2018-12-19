"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
const logger_1 = require("@fullstack-one/logger");
let BootLoader = class BootLoader {
    constructor(loggerFactory) {
        this.IS_BOOTING = false; // TODO: Dustin Rename
        this.HAS_BOOTED = false; // TODO: Dustin Rename
        this.bootFunctions = [];
        this.bootReadyFunctions = [];
        // init logger
        this.logger = loggerFactory.create(this.constructor.name);
    }
    isBooting() {
        return this.IS_BOOTING;
    }
    hasBooted() {
        return this.HAS_BOOTED;
    }
    addBootFunction(name, fn) {
        this.logger.trace("addBootFunction", name);
        this.bootFunctions.push({ name, fn });
    }
    onBootReady(name, fn) {
        this.logger.trace("onBootReady", name);
        if (this.HAS_BOOTED) {
            return fn();
        }
        this.bootReadyFunctions.push({ name, fn });
    }
    getReadyPromise() {
        return new Promise((resolve, reject) => {
            if (this.HAS_BOOTED) {
                return resolve();
            }
            this.bootReadyFunctions.push({ name: "BoorLoader.ready", fn: resolve });
        });
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.IS_BOOTING = true;
            try {
                for (const fnObj of this.bootFunctions) {
                    this.logger.trace("boot.bootFunctions.start", fnObj.name);
                    yield fnObj.fn(this);
                    this.logger.trace("boot.bootFunctions.end", fnObj.name);
                }
                for (const fnObj of this.bootReadyFunctions) {
                    this.logger.trace("boot.bootReadyFunctions.start", fnObj.name);
                    fnObj.fn(this);
                    this.logger.trace("boot.bootReadyFunctions.start", fnObj.name);
                }
                this.IS_BOOTING = false;
                this.HAS_BOOTED = true;
            }
            catch (err) {
                process.stderr.write("BootLoader.boot.error.caught\n");
                process.stderr.write(`${err}`);
                process.exit(0);
            }
        });
    }
};
BootLoader = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => logger_1.LoggerFactory)),
    __metadata("design:paramtypes", [Object])
], BootLoader);
exports.BootLoader = BootLoader;
