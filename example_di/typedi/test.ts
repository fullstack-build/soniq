import 'reflect-metadata';
import { Container, Inject, Service } from 'typedi';
export { Container, Inject, Service };
import { BeanFactory } from './testCoffee';
import { WaterFactory } from './testWater';
import { sugarFactory, Sugar } from './testSugar';

@Service()
export class CoffeeMaker {

  public random = Math.random();

  @Inject(type => BeanFactory)
  public beanFactory: BeanFactory;

  @Inject()
  public sugarFactory: Sugar;

  @Inject()
  public sugarFactory2: Sugar;

  @Inject(type => WaterFactory)
  public waterFactory: WaterFactory;

  constructor(beanFactory: BeanFactory) {
    // tslint:disable-next-line:no-console
    console.log('CONSTRUCT', beanFactory, this.beanFactory);
  }

  public make() {
    this.beanFactory.create();
    this.sugarFactory.create();
    this.sugarFactory.create();
    this.waterFactory.create();
    // tslint:disable-next-line:no-console
    console.log('=coffee', this.random);
  }

}

const coffeeMaker = Container.get(CoffeeMaker);
coffeeMaker.make();
