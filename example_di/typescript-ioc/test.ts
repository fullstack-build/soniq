import { Singleton, AutoWired, Inject, Container } from 'typescript-ioc/es6';

import { PersonDAO } from './testPersonDao';
import { PersonDAO3 } from './testPersonDao3';

@Singleton
@AutoWired
export class PersonRestProxy {
  public random;

  @Inject
  private person: PersonDAO;

  constructor () {
    this.random = Math.random();
  }
}

// let personDAO: PersonDAO = new PersonDAO();
const personDAO: PersonDAO = Container.get(PersonDAO);

// tslint:disable-next-line:no-console
console.log('**1', personDAO.creationTime, personDAO.restProxy.random);

// let personDAO2: PersonDAO = new PersonDAO();
const personDAO2: PersonDAO = Container.get(PersonDAO);

// tslint:disable-next-line:no-console
console.log('**2', personDAO.creationTime,  personDAO2.restProxy.random);

// let personDAO3: PersonDAO3 = new PersonDAO3();
const personDAO3: PersonDAO3 = Container.get(PersonDAO);

// tslint:disable-next-line:no-console
console.log('**3', personDAO3.creationTime,  personDAO3.restProxy.random);

// DOES NOT SUPPORT CIRCULAR DEPENDENCIES
