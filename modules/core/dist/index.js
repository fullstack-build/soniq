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
const typedi_1 = require("typedi");
exports.Service = typedi_1.Service;
exports.Container = typedi_1.Container;
const BootLoader_1 = require("./BootLoader");
process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection:", reason);
});
let Core = class Core {
    constructor() {
        this.bootLoader = new BootLoader_1.BootLoader();
    }
    // draw CLI art
    drawCliArt() {
        process.stdout.write(`  ┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n  ├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤\n  └  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n`);
        //process.stdout.write(`${JSON.stringify(this.ENVIRONMENT, null, 2)}\n`);
        process.stdout.write("____________________________________\n");
    }
    async boot() {
        await this.bootLoader.boot();
        this.drawCliArt();
        return;
    }
};
Core = __decorate([
    typedi_1.Service("@fullstack-one/core"),
    __metadata("design:paramtypes", [])
], Core);
exports.Core = Core;
