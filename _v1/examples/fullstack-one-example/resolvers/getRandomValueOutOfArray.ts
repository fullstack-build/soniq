import { Container } from "@fullstack-one/di";

// Impl DI
import { Randomizer } from "../modules/Randomizer";

export default async (obj, args, context, info, params, f1) => {
  const randomizer = Container.get(Randomizer);
  return randomizer.getRandomValueOutOfArray(args.possibleValues);
};
