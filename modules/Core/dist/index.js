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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
// DI
const typedi_1 = require("typedi");
exports.Service = typedi_1.Service;
exports.Container = typedi_1.Container;
exports.ContainerInstance = typedi_1.ContainerInstance;
exports.Inject = typedi_1.Inject;
exports.InjectMany = typedi_1.InjectMany;
const tslog_1 = require("tslog");
exports.Logger = tslog_1.Logger;
const BootLoader_1 = require("./BootLoader");
const ConfigManager_1 = require("./ConfigManager");
process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection:", reason);
});
let Core = class Core {
    constructor() {
        this._className = this.constructor.name;
        this.configManager = new ConfigManager_1.ConfigManager();
        this.ENVIRONMENT = this.configManager.ENVIRONMENT;
        typedi_1.Container.set("@soniq/ENVIRONMENT", JSON.parse(JSON.stringify(this.ENVIRONMENT)));
        // TODO: catch all errors & exceptions
        this._logger = new tslog_1.Logger({
            instanceId: this.ENVIRONMENT.nodeId,
            name: this._className,
        });
        this._bootLoader = new BootLoader_1.BootLoader(this._logger);
    }
    // draw CLI art
    _drawCliArt() {
        process.stdout.write(`     
  ___  ___  _ __  _  __ _ 
 / __|/ _ \\| '_ \\| |/ _\` |
 \\__ \\ (_) | | | | | (_| |
 |___/\\___/|_| |_|_|\\__, |
                       | |
                       |_|\n`);
        process.stdout.write("____________________________________\n");
        process.stdout.write(JSON.stringify(this.ENVIRONMENT, undefined, 2) + "\n");
        process.stdout.write("====================================\n");
    }
    async boot() {
        await this._bootLoader.boot();
        this._drawCliArt();
        return;
    }
    getLogger(name, minLevel = 0, exposeStack = false) {
        return new tslog_1.Logger({
            instanceId: this.ENVIRONMENT.nodeId,
            name,
            minLevel,
            exposeStack,
        });
    }
};
Core = __decorate([
    typedi_1.Service("@soniq"),
    __metadata("design:paramtypes", [])
], Core);
exports.Core = Core;
//# sourceMappingURL=index.js.map