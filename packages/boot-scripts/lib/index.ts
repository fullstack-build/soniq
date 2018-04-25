
import { Service, Container, Inject } from '@fullstack-one/di';
import { IEnvironment } from '@fullstack-one/config';
import { EventEmitter } from '@fullstack-one/events';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';

import * as fastGlob from 'fast-glob';

@Service()
export class BootScripts {

  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  private eventEmitter: EventEmitter;

  constructor(
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(tpye => BootLoader) bootLoader?) {

    this.logger = loggerFactory.create('BootScripts');

    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  // execute all boot scripts in the boot folder
  private async boot() {
    // get all boot files sync
    const files: any = fastGlob.sync(`${this.ENVIRONMENT.path}/boot/*.{ts,js}`, {
      deep: true,
      onlyFiles: true,
    });

    // sort files
    files.sort();
    // execute all boot scripts
    for (const file of files) {
      // include all boot files sync
      const bootScript = require(file);
      try {
        bootScript.default != null
          ? await bootScript.default(this)
          : await bootScript(this);
        this.logger.trace('boot script successful', file);
      } catch (err) {
        this.logger.warn('boot script error', file, err);
      }
    }
  }

}
