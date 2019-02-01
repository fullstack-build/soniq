// DI
import { Service, Inject } from "@fullstack-one/di";

interface IPossibleNumbers {
  values: string[];
}

export interface IRandomResult {
  randomResult: string;
}

@Service()
export class Randomizer {
  public getRandomValueOutOfArray(possibleValues: IPossibleNumbers): IRandomResult {
    const maxIndex = possibleValues.values.length;
    const randomIndex = Math.floor(Math.random() * maxIndex);
    return { randomResult: possibleValues.values[randomIndex] };
  }
}
