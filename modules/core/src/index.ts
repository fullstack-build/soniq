import "reflect-metadata";
import {Service, Container} from "typedi";
export {Service, Container};

@Service("@fullstack-one/core")
export class Core {

  constructor() {
    process.stdout.write(
      `  ┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n  ├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤\n  └  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n`
    );
    //process.stdout.write(`${JSON.stringify(this.ENVIRONMENT, null, 2)}\n`);
    process.stdout.write("____________________________________\n");
  }

}
