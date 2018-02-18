import { Singleton, AutoWired, Inject, Container } from 'typescript-ioc/es6';
import { PersonRestProxy } from './test';

export class PersonDAO {
  @Inject
  public creationTime: Date;

  @Inject
  public restProxy: PersonRestProxy;

  constructor() {
    // empty constructor
  }
}
