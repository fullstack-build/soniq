import { IFullstackOneCore } from './index';
import { Logger } from './logger';

/*export interface IAbstractPackage {
  // todo
}*/

export abstract class AbstractPackage /*implements IAbstractPackage*/ {

  protected $one: IFullstackOneCore;
  protected logger: Logger;
  private className: string;

   constructor($one: IFullstackOneCore) {
    this.className = this.constructor.name;
    this.$one = $one;
    // create logger
     this.logger = this.$one.getLogger(`fullstack-one:${$one.nodeId}:${this.className}`);
  }

}
