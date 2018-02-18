import { Container, Inject, Service } from 'typedi';
import { CoffeeMaker } from './test';

@Service()
export class BeanFactory {

  @Inject(type => CoffeeMaker)
  private coffee: CoffeeMaker;

  public create() {

    // tslint:disable-next-line:no-console
    console.log('+bean', this.coffee);
  }
}
