import * as Test from './test';

@Test.Service()
export class WaterFactory {

  @Test.Inject(type => Test.CoffeeMaker)
  private coffee: Test.CoffeeMaker;

  public create() {

    // tslint:disable-next-line:no-console
    console.log('+water', this.coffee);
  }
}
