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
// ENV
const dotenv = require("dotenv-safe");
// DI
require("reflect-metadata");
const di_1 = require("@fullstack-one/di");
// fullstack.one required imports
const boot_loader_1 = require("@fullstack-one/boot-loader");
const config_1 = require("@fullstack-one/config");
// init .env -- check if all are set
try {
    dotenv.config({
        // .env.example is in fullstack-one root folder
        sample: `${__dirname}/../../../.env.example`,
    });
}
catch (err) {
    process.stderr.write(err.toString() + '\n');
    process.exit(1);
}
let FullstackOneCore = class FullstackOneCore {
    constructor(bootLoader, config) {
        this.ENVIRONMENT = config.ENVIRONMENT;
        this.bootLoader = bootLoader;
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cliArt();
            return yield this.bootLoader.boot();
        });
    }
    // draw CLI art
    cliArt() {
        process.stdout.write('  ┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n' +
            '  ├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤ \n' +
            '  └  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n');
        process.stdout.write('name: ' + this.ENVIRONMENT.name + '\n');
        process.stdout.write('version: ' + this.ENVIRONMENT.version + '\n');
        process.stdout.write('path: ' + this.ENVIRONMENT.path + '\n');
        process.stdout.write('env: ' + this.ENVIRONMENT.NODE_ENV + '\n');
        process.stdout.write('port: ' + this.ENVIRONMENT.port + '\n');
        process.stdout.write('node id: ' + this.ENVIRONMENT.nodeId + '\n');
        process.stdout.write('____________________________________\n');
    }
};
FullstackOneCore = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => boot_loader_1.BootLoader)), __param(1, di_1.Inject(type => config_1.Config)),
    __metadata("design:paramtypes", [Object, Object])
], FullstackOneCore);
exports.FullstackOneCore = FullstackOneCore;
// GETTER
// ONE SINGLETON
/*const $one: FullstackOneCore = Container.get(FullstackOneCore);
export function getInstance(): FullstackOneCore {
  return $one;
}

// return finished booting promise
export function getReadyPromise(): Promise<FullstackOneCore> {
  return new Promise(($resolve, $reject) => {

    // already booted?
    if ($one.isReady) {
      $resolve($one);
    } else {

      // catch ready event
      Container.get(EventEmitter).on(`${$one.ENVIRONMENT.namespace}.ready`, () => {
        $resolve($one);
      });
      // catch not ready event
      Container.get(EventEmitter).on(`${$one.ENVIRONMENT.namespace}.not-ready`, (err) => {
        $reject(err);
      });
    }

  });
}

// helper to convert an event into a promise
export function eventToPromise(pEventName: string): Promise<any> {
  return new Promise(($resolve, $reject) => {
    Container.get(EventEmitter).on(pEventName, (...args: any[]) => {
      $resolve([... args]);
    });

  });
}*/
