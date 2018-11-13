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
const boot_loader_1 = require("@fullstack-one/boot-loader");
const fastGlob = require("fast-glob");
let BootScripts = class BootScripts {
    constructor(loggerFactory, bootLoader) {
        this.logger = loggerFactory.create(this.constructor.name);
        // get settings from DI container
        this.ENVIRONMENT = di_1.Container.get("ENVIRONMENT");
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    // execute all boot scripts in the boot folder
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            // get all boot files sync
            const files = fastGlob.sync(`${this.ENVIRONMENT.path}/boot/*.{ts,js}`, {
                deep: true,
                onlyFiles: true
            });
            // sort files
            files.sort();
            // execute all boot scripts
            for (const file of files) {
                // include all boot files sync
                const bootScript = require(file);
                try {
                    bootScript.default != null ? yield bootScript.default(this) : yield bootScript(this);
                    this.logger.trace("boot script successful", file);
                }
                catch (err) {
                    this.logger.warn("boot script error", file, err);
                }
            }
        });
    }
};
BootScripts = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => logger_1.LoggerFactory)), __param(1, di_1.Inject((tpye) => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object, Object])
], BootScripts);
exports.BootScripts = BootScripts;
