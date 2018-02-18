import { Container, Inject, Service } from 'typedi';
import { CoffeeMaker } from './test';

export const sugarFactory = (huhu) => {
  return new Sugar('sweet', huhu);
};

@Service({ factory: sugarFactory })
export class Sugar {
  private p;
  private random;
  constructor(p, p2) {
    this.p = p;
    this.random = Math.random();
    // tslint:disable-next-line:no-console
    console.log('* creating sugar', p, p2);
  }
  public create() {
    // tslint:disable-next-line:no-console
    console.log('+sugar', this.p, this.random);
  }
}
